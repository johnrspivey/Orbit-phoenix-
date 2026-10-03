const crypto = require("crypto");
const childProcess = require("child_process");
const express = require("express");
const axios = require("axios");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

const MIN_SECRET_LENGTH = 32;

// The only PM2 processes pm2_restart may touch. Anything else is refused.
const PM2_RESTART_ALLOWLIST = ["content-quarry-api", "gig-pig-api", "gig-pig-frontend"];

const NETLIFY_HOOK_PREFIX = "https://api.netlify.com/build_hooks/";

// Returns a reason string if the secret is unusable, or null if it is fine.
function checkSecret(secret){
  if(typeof secret!=="string"||secret.length===0)return "SKIPPER_SECRET is not set";
  if(secret.length<MIN_SECRET_LENGTH)return "SKIPPER_SECRET must be at least "+MIN_SECRET_LENGTH+" characters (it is "+secret.length+")";
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

// What gets written to the request log: no query string, and anything after /mcp/ hidden.
function redactUrl(url,secret){
  const path=String(url).split("?")[0].replace(/(\/mcp\/)[^/]*/gi,"$1[redacted]");
  let decoded=path;
  try{decoded=decodeURIComponent(path);}catch(e){}
  if(secret&&(path.includes(secret)||decoded.includes(secret)))return "[redacted]";
  return path;
}

function isAllowedNetlifyHook(hookUrl){
  if(typeof hookUrl!=="string"||!hookUrl.startsWith(NETLIFY_HOOK_PREFIX))return false;
  let u;
  try{u=new URL(hookUrl);}catch(e){return false;}
  return u.protocol==="https:"&&u.hostname==="api.netlify.com"&&u.port===""&&
    u.username===""&&u.password===""&&u.pathname.startsWith("/build_hooks/");
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
  app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","x-skipper-secret, Content-Type, mcp-session-id");
    res.header("Access-Control-Allow-Methods","GET, POST, DELETE, OPTIONS");
    if(req.method==="OPTIONS")return res.sendStatus(200);
    next();
  });

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
      execFile("pm2",["jlist"],(err,stdout)=>{
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
        execFile("pm2",["restart",name],(err)=>{
          if(err)return reject(new Error(err.message));
          resolve({content:[{type:"text",text:"Restarted "+name}]});
        });
      });
    },

    github_read: async ({owner,repo,path})=>{
      try{
        const r=await http.get("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});
        return{content:[{type:"text",text:JSON.stringify({content:Buffer.from(r.data.content,"base64").toString("utf8"),sha:r.data.sha})}]};
      }catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
    },

    github_write: async ({owner,repo,path,content,message,sha})=>{
      try{
        const payload={message,content:Buffer.from(content).toString("base64")};
        if(sha)payload.sha=sha;
        const r=await http.put("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,payload,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});
        return{content:[{type:"text",text:"Committed. SHA: "+r.data.commit.sha}]};
      }catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
    },

    netlify_deploy: async ({hook_url})=>{
      if(!isAllowedNetlifyHook(hook_url))return errorResult("Refused: hook_url must start with "+NETLIFY_HOOK_PREFIX);
      try{await http.post(hook_url);return{content:[{type:"text",text:"Deploy triggered."}]};}
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

  // Malformed JSON etc: answer without a stack trace and without logging the URL.
  app.use((err,req,res,next)=>{
    logError("Request error:",err&&err.message);
    if(res.headersSent)return next(err);
    const status=err&&err.status>=400&&err.status<500?err.status:500;
    res.status(status).json({jsonrpc:"2.0",error:{code:status===500?-32603:-32700,message:status===500?"Internal server error":"Bad request"},id:null});
  });

  return app;
}

module.exports={createApp,checkSecret,secretMatches,redactUrl,isAllowedNetlifyHook,PM2_RESTART_ALLOWLIST,NETLIFY_HOOK_PREFIX,MIN_SECRET_LENGTH};
