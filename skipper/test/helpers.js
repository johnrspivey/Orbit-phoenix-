const request = require("supertest");

const SECRET = "test-secret-0123456789abcdef0123456789abcdef"; // 44 chars

// Pull the JSON-RPC message out of a response that may be plain JSON or an SSE stream.
function parseRpc(res) {
  const type = res.headers["content-type"] || "";
  if (type.includes("application/json")) return res.body;
  const dataLine = res.text.split("\n").find((l) => l.startsWith("data: "));
  if (!dataLine) throw new Error("No JSON-RPC message in response: " + res.text);
  return JSON.parse(dataLine.slice("data: ".length));
}

function rpc(app, path, body, headers = {}) {
  let req = request(app)
    .post(path)
    .set("Accept", "application/json, text/event-stream")
    .set("Content-Type", "application/json");
  for (const [k, v] of Object.entries(headers)) req = req.set(k, v);
  return req.send(body);
}

function callTool(app, name, args, path = "/mcp/" + SECRET) {
  return rpc(app, path, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
}

module.exports = { SECRET, parseRpc, rpc, callTool };
