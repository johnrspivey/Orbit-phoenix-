const crypto = require("crypto");
const childProcess = require("child_process");
const express = require("express");
const axios = require("axios");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

const MIN_SECRET_LENGTH = 32;
const MIN_SECRET_UNIQUE_CHARS = 16;

// github_read / github_write may only touch this account's repos.
const GITHUB_OWNER = "johnrspivey";

// The only PM2 processes pm2_restart may touch. Anything else is refused.
const PM2_RESTART_ALLOWLIST = ["content-quarry-api", "gig-pig-api", "gig-pig-frontend"];

const NETLIFY_HOOK_PREFIX = "https://api.netlify.com/build_hooks/";

// Returns a reason string if the secret is unusable, or null if it is fine.
function checkSecret(secret){
  if(typeof secret!=="string"||secret.length===0)return "SKIPPER_SECRET is not set";
  if(secret.length<MIN_SECRET_LENGTH)return "SKIPPER_SECRET must be at least "+MIN_SECRET_LENGTH+" characters (it is "+secret.length+")";
  const unique=new Set(secret).size;
  if(unique<MIN_SECRET_UNIQUE_CHARS)return "SKIPPER_SECRET is too weak: it needs at least "+MIN_SECRET_UNIQUE_CHARS+" different characters (it has "+unique+")";
  return null;
}

// Constant-time comparison. Both sides are hashed first so the buffers are always
// the same length (timingSafeEqual throws otherwise) and the length isn't leaked.
function secretMatches(expected,provided){
  if(typeof provided!=="string"||provided.length===0)return false;
  const a=crypto.createHash("sha256").update(expected).digest();
  const b=crypto.createHash("sha256").update(provided).digest();
  return crypto.timingSafeEqual(a,b);
}

// Decodes every well-formed %XX on its own, so one malformed escape elsewhere in the
// string can't stop the rest from being decoded (decodeURIComponent is all-or-nothing).
function lenientDecode(str){
  let cur=String(str);
  for(let i=0;i<5;i++){
    const next=cur.replace(/%([0-9a-f]{2})/gi,(m,h)=>String.fromCharCode(parseInt(h,16)));
    if(next===cur)break;
    cur=next;
  }
  return cur;
}

// What gets written to the request log: no query string, and anything after /mcp/ hidden.
function redactUrl(url,secret){
  const path=String(url).split("?")[0].replace(/(\/mcp\/)[^/]*/gi,"$1[redacted]");
  if(secret&&(path.includes(secret)||lenientDecode(path).includes(secret)))return "[redacted]";
  return path;
}

// Rejects "..", backslashes and percent-encoded dots, slashes or backslashes, checked on
// the raw value and again after each round of decoding. Malformed encoding is rejected too.
function isSafeGithubPart(value,{allowSlash}){
  if(typeof value!=="string"||value.length===0)return false;
  let cur=value;
  for(let i=0;i<5;i++){
    if(cur.includes("..")||cur.includes("\\")||/%(2e|2f|5c)/i.test(cur))return false;
    if(!allowSlash&&cur.includes("/"))return false;
    let next;
    try{next=decodeURIComponent(cur);}catch(e){return false;}
    if(next===cur)break;
    cur=next;
  }
  // No empty or "." segments either ("a//b", "./x").
  return cur.split("/").every(seg=>seg!==""&&seg!==".");
}

// Validates owner/repo/path and builds the contents URL with every segment encoded.
// Returns null if anything is not allowed.
function githubContentsUrl(owner,repo,path){
  if(owner!==GITHUB_OWNER)return null;
  if(!isSafeGithubPart(repo,{allowSlash:false})||!isSafeGithubPart(path,{allowSlash:true}))return null;
  const encodedPath=path.split("/").map(encodeURIComponent).join("/");
  return "https://api.github.com/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(repo)+"/contents/"+encodedPath;
}

// Environment handed to pm2: only what it needs to find itself and its daemon.
// Skipper's own settings (SKIPPER_SECRET, GITHUB_TOKEN, ...) are never passed on.
const PM2_ENV_KEYS = ["PATH", "HOME", "PM2_HOME"];
function pm2Env(source=process.env){
  const env={};
  for(const k of PM2_ENV_KEYS)if(typeof source[k]==="string")env[k]=source[k];
  return env;
}

// The only query option a build hook may carry.
const NETLIFY_ALLOWED_QUERY = ["trigger_title"];

function isAllowedNetlifyHook(hookUrl){
  if(typeof hookUrl!=="string"||!hookUrl.startsWith(NETLIFY_HOOK_PREFIX))return false;
  // No encoded characters or backslashes in the path part (before any ? or #).
  const rawPath=hookUrl.split(/[?#]/)[0];
  if(rawPath.includes("%")||rawPath.includes("\\"))return false;
  let u;
  try{u=new URL(hookUrl);}catch(e){return false;}
  if(!(u.protocol==="https:"&&u.hostname==="api.netlify.com"&&u.port===""&&
    u.username===""&&u.password===""&&/^\/build_hooks\/[A-Za-z0-9_-]+$/.test(u.pathname)))return false;
  // Query: only trigger_title, at most once. Keys are compared after decoding, so
  // trigger%5Fbranch is still trigger_branch. ";" is refused because some servers
  // treat it as a separator that URLSearchParams doesn't.
  if(u.search.includes(";"))return false;
  const keys=[...u.searchParams.keys()];
  if(keys.some(k=>!NETLIFY_ALLOWED_QUERY.includes(k)))return false;
  if(new Set(keys).size!==keys.length)return false;
  return true;
}

function errorResult(text){
  return{isError:true,content:[{type:"text",text}]};
}

function createApp(options={}){
  const secret=options.secret;
  const problem=checkSecret(secret);
  if(problem)throw new Error(problem);

  const execFile=options.execFile||childProcess.execFile;
  const http=options.http||axios;
  const log=options.log||console.log;
  const logError=options.logError||console.error;
  const GITHUB_TOKEN=options.githubToken!==undefined?options.githubToken:process.env.GITHUB_TOKEN;

  const app=express();
  app.use((req,res,next)=>{log(req.method,redactUrl(req.originalUrl,secret));next();});
  // No CORS headers: the claude.ai connector calls us server-to-server, so browsers
  // on other sites get no permission to call Skipper.

  app.get("/ping",(req,res)=>res.json({status:"Skipper is running",time:new Date().toISOString()}));

  // Secret may arrive in the x-skipper-secret header or as /mcp/<secret>.
  // Any failure is a bare 401 with no explanation.
  function requireSecret(req,res,next){
    if(secretMatches(secret,req.get("x-skipper-secret"))||secretMatches(secret,req.params.secret))return next();
    res.status(401).end();
  }

  // Tool handlers defined ONCE at startup — not recreated per request
  const tools={
    pm2_status: async () => new Promise((resolve,reject)=>{
      execFile("pm2",["jlist"],{env:pm2Env()},(err,stdout)=>{
        if(err)return reject(new Error(err.message));
        try{
          const s=JSON.parse(stdout).map(p=>({name:p.name,status:p.pm2_env.status,restarts:p.pm2_env.restart_time,memoryMB:Math.round(p.monit.memory/1024/1024),cpu:p.monit.cpu}));
          resolve({content:[{type:"text",text:JSON.stringify(s,null,2)}]});
        }catch(e){reject(new Error("Parse failed"));}
      });
    }),

    pm2_restart: async ({name}) => {
      if(!PM2_RESTART_ALLOWLIST.includes(name))return errorResult("Refused: pm2_restart only accepts "+PM2_RESTART_ALLOWLIST.join(", "));
      return new Promise((resolve,reject)=>{
        execFile("pm2",["restart",name],{env:pm2Env()},(err)=>{
          if(err)return reject(new Error(err.message));
          resolve({content:[{type:"text",text:"Restarted "+name}]});
        });
      });
    },

    github_read: async ({owner,repo,path})=>{
      const url=githubContentsUrl(owner,repo,path);
      if(!url)return errorResult("Refused: owner must be "+GITHUB_OWNER+" and repo/path may not contain '..', backslashes or encoded dots/slashes");
      try{
        const r=await http.get(url,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});
        return{content:[{type:"text",text:JSON.stringify({content:Buffer.from(r.data.content,"base64").toString("utf8"),sha:r.data.sha})}]};
      }catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
    },

    github_write: async ({owner,repo,path,content,message,sha})=>{
      const url=githubContentsUrl(owner,repo,path);
      if(!url)return errorResult("Refused: owner must be "+GITHUB_OWNER+" and repo/path may not contain '..', backslashes or encoded dots/slashes");
      try{
        const payload={message,content:Buffer.from(content).toString("base64")};
        if(sha)payload.sha=sha;
        const r=await http.put(url,payload,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});
        return{content:[{type:"text",text:"Committed. SHA: "+r.data.commit.sha}]};
      }catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
    },

    netlify_deploy: async ({hook_url})=>{
      if(!isAllowedNetlifyHook(hook_url))return errorResult("Refused: hook_url must start with "+NETLIFY_HOOK_PREFIX);
      try{await http.post(hook_url,undefined,{maxRedirects:0});return{content:[{type:"text",text:"Deploy triggered."}]};}
      catch(e){return{content:[{type:"text",text:"Deploy error: "+e.message}]};}
    }
  };

  function makeMcpServer(){
    const server=new McpServer({name:"skipper",version:"1.0.0"});
    server.tool("pm2_status","Get status of all PM2 processes",{},tools.pm2_status);
    server.tool("pm2_restart","Restart a PM2 process by name",{name:z.string()},tools.pm2_restart);
    server.tool("github_read","Read a file from GitHub",{owner:z.string(),repo:z.string(),path:z.string()},tools.github_read);
    server.tool("github_write","Write a file to GitHub",{owner:z.string(),repo:z.string(),path:z.string(),content:z.string(),message:z.string(),sha:z.string().optional()},tools.github_write);
    server.tool("netlify_deploy","Trigger a Netlify deploy",{hook_url:z.string()},tools.netlify_deploy);
    return server;
  }

  const mcpPaths=["/mcp","/mcp/:secret"];
  const methodNotAllowed=(req,res)=>res.status(405).json({jsonrpc:"2.0",error:{code:-32000,message:"Method not allowed."},id:null});

  // Auth runs before the JSON body is parsed, so strangers can't make us do any work.
  app.post(mcpPaths,requireSecret,express.json(),async(req,res)=>{
    const server=makeMcpServer();
    try{
      const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
      await server.connect(transport);
      await transport.handleRequest(req,res,req.body);
      res.on("close",()=>{transport.close();server.close();});
    }catch(e){
      logError(e);
      if(!res.headersSent)res.status(500).json({jsonrpc:"2.0",error:{code:-32603,message:"Internal server error"},id:null});
    }
  });

  app.get(mcpPaths,requireSecret,methodNotAllowed);
  app.delete(mcpPaths,requireSecret,methodNotAllowed);

  // Plain 404: Express's default page would echo the requested URL back.
  app.use((req,res)=>res.status(404).end());

  // Malformed JSON, bad %-encoding, etc. Error messages can quote the URL (and so the
  // secret), so only the status is logged, never err.message.
  app.use((err,req,res,next)=>{
    logError("Request error: status "+(err&&err.status||500));
    if(res.headersSent)return next(err);
    const status=err&&err.status>=400&&err.status<500?err.status:500;
    res.status(status).json({jsonrpc:"2.0",error:{code:status===500?-32603:-32700,message:status===500?"Internal server error":"Bad request"},id:null});
  });

  return app;
}

module.exports={createApp,checkSecret,secretMatches,redactUrl,isAllowedNetlifyHook,isSafeGithubPart,githubContentsUrl,pm2Env,PM2_ENV_KEYS,GITHUB_OWNER,MIN_SECRET_UNIQUE_CHARS,PM2_RESTART_ALLOWLIST,NETLIFY_HOOK_PREFIX,MIN_SECRET_LENGTH};
