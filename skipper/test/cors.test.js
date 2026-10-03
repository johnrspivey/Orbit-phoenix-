const { test } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const { createApp } = require("../app");
const { SECRET, rpc } = require("./helpers");

const app = createApp({ secret: SECRET, log: () => {}, logError: () => {} });
const listTools = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };

function assertNoCors(res) {
  for (const h of Object.keys(res.headers)) assert.ok(!h.startsWith("access-control-"), "unexpected CORS header: " + h);
}

test("no CORS headers on an authenticated MCP call", async () => {
  const res = await rpc(app, "/mcp/" + SECRET, listTools, { Origin: "https://evil.example" });
  assert.strictEqual(res.status, 200);
  assertNoCors(res);
});

test("no CORS headers on a browser preflight, /ping or a 401", async () => {
  const pre = await request(app).options("/mcp").set("Origin", "https://evil.example")
    .set("Access-Control-Request-Method", "POST").set("Access-Control-Request-Headers", "x-skipper-secret");
  assertNoCors(pre);
  assertNoCors(await request(app).get("/ping").set("Origin", "https://evil.example"));
  assertNoCors(await request(app).post("/mcp").set("Origin", "https://evil.example"));
});
