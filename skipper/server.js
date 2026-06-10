const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

const app = express();
app.use(express.json());
app.use((req,res,next)=>{console.log(req.method,req.url);next();});
app.use((req,res,next)=>{
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","x-skipper-secret, Content-Type, mcp-session-id");
  res.header("Access-Control-Allow-Methods","GET, POST, DELETE, OPTIONS");
  if(req.method==="OPTIONS")return res.sendStatus(200);
  next();
});

const PORT=process.env.PORT||3400;
const GITHUB_TOKEN=process.env.GITHUB_TOKEN;

app.get("/ping",(req,res)=>res.json({status:"Skipper is running",time:new Date().toISOString()}));

function makeMcpServer(){
  const server=new McpServer({name:"skipper",version:"1.0.0"});
  server.tool("pm2_status","Get status of all PM2 processes",{},async()=>{
    return new Promise((resolve,reject)=>{
      exec("pm2 jlist",(err,stdout)=>{
        if(err)return reject(new Error(err.message));
        try{const s=JSON.parse(stdout).map(p=>({name:p.name,status:p.pm2_env.status,restarts:p.pm2_env.restart_time,memoryMB:Math.round(p.monit.memory/1024/1024),cpu:p.monit.cpu}));resolve({content:[{type:"text",text:JSON.stringify(s,null,2)}]});}
        catch(e){reject(new Error("Parse failed"));}
      });
    });
  });
  server.tool("pm2_restart","Restart a PM2 process by name",{name:z.string()},async({name})=>{
    return new Promise((resolve,reject)=>{
      exec("pm2 restart "+name,(err)=>{
        if(err)return reject(new Error(err.message));
        resolve({content:[{type:"text",text:"Restarted "+name}]});
      });
    });
  });
  server.tool("github_read","Read a file from GitHub",{owner:z.string(),repo:z.string(),path:z.string()},async({owner,repo,path})=>{
    try{const r=await axios.get("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});return{content:[{type:"text",text:JSON.stringify({content:Buffer.from(r.data.content,"base64").toString("utf8"),sha:r.data.sha})}]};}
    catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
  });
  server.tool("github_write","Write a file to GitHub",{owner:z.string(),repo:z.string(),path:z.string(),content:z.string(),message:z.string(),sha:z.string().optional()},async({owner,repo,path,content,message,sha})=>{
    try{const payload={message,content:Buffer.from(content).toString("base64")};if(sha)payload.sha=sha;const r=await axios.put("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,payload,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});return{content:[{type:"text",text:"Committed. SHA: "+r.data.commit.sha}]};}
    catch(e){return{content:[{type:"text",text:"GitHub error: "+(e.response?JSON.stringify(e.response.data):e.message)}]};}
  });
  server.tool("netlify_deploy","Trigger a Netlify deploy",{hook_url:z.string()},async({hook_url})=>{
    try{await axios.post(hook_url);return{content:[{type:"text",text:"Deploy triggered."}]};}
    catch(e){return{content:[{type:"text",text:"Deploy error: "+e.message}]};}
  });
  return server;
}

app.post("/mcp",async(req,res)=>{
  const server=makeMcpServer();
  try{
    const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
    await server.connect(transport);
    await transport.handleRequest(req,res,req.body);
    res.on("close",()=>{transport.close();server.close();});
  }catch(e){
    console.error(e);
    if(!res.headersSent)res.status(500).json({jsonrpc:"2.0",error:{code:-32603,message:"Internal server error"},id:null});
  }
});

app.get("/mcp",(req,res)=>res.status(405).json({jsonrpc:"2.0",error:{code:-32000,message:"Method not allowed."},id:null}));
app.delete("/mcp",(req,res)=>res.status(405).json({jsonrpc:"2.0",error:{code:-32000,message:"Method not allowed."},id:null}));

app.listen(PORT,()=>console.log("Skipper running on port "+PORT));