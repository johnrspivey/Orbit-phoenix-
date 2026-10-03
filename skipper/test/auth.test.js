const { test } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const { createApp, secretMatches } = require("../app");
const { SECRET, parseRpc, rpc } = require("./helpers");

const listTools = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
const app = createApp({ secret: SECRET, log: () => {}, logError: () => {} });

test("no secret at all: 401 with an empty body", async () => {
  const res = await rpc(app, "/mcp", listTools);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.text, "");
});

test("wrong secret in header: 401", async () => {
  const res = await rpc(app, "/mcp", listTools, { "x-skipper-secret": SECRET.slice(0, -1) + "X" });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.text, "");
});

test("wrong secret in path: 401", async () => {
  const res = await rpc(app, "/mcp/not-the-secret", listTools);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.text, "");
});

test("wrong secret of a different length (prefix of the real one): 401", async () => {
  const res = await rpc(app, "/mcp/" + SECRET.slice(0, 10), listTools);
  assert.strictEqual(res.status, 401);
});

test("GET and DELETE on /mcp also need the secret", async () => {
  assert.strictEqual((await request(app).get("/mcp")).status, 401);
  assert.strictEqual((await request(app).delete("/mcp/nope")).status, 401);
  assert.strictEqual((await request(app).get("/mcp/" + SECRET)).status, 405);
});

test("correct secret in header: tools are listed, names unchanged", async () => {
  const res = await rpc(app, "/mcp", listTools, { "x-skipper-secret": SECRET });
  assert.strictEqual(res.status, 200);
  const names = parseRpc(res).result.tools.map((t) => t.name).sort();
  assert.deepStrictEqual(names, ["github_read", "github_write", "netlify_deploy", "pm2_restart", "pm2_status"]);
});

test("correct secret in path: tools are listed", async () => {
  const res = await rpc(app, "/mcp/" + SECRET, listTools);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(parseRpc(res).result.tools.length, 5);
});

test("tool inputs are unchanged (connector compatibility)", async () => {
  const res = await rpc(app, "/mcp/" + SECRET, listTools);
  const byName = Object.fromEntries(parseRpc(res).result.tools.map((t) => [t.name, t.inputSchema]));
  assert.deepStrictEqual(Object.keys(byName.pm2_restart.properties), ["name"]);
  assert.strictEqual(byName.pm2_restart.properties.name.type, "string");
  assert.deepStrictEqual(Object.keys(byName.netlify_deploy.properties), ["hook_url"]);
  assert.deepStrictEqual(Object.keys(byName.github_read.properties).sort(), ["owner", "path", "repo"]);
  assert.deepStrictEqual(Object.keys(byName.github_write.properties).sort(), ["content", "message", "owner", "path", "repo", "sha"]);
  assert.deepStrictEqual(Object.keys(byName.pm2_status.properties || {}), []);
});

test("unauthenticated requests are rejected before the body is parsed", async () => {
  const res = await request(app).post("/mcp").set("Content-Type", "application/json").send("{not json");
  assert.strictEqual(res.status, 401);
});

test("/ping stays public and reveals nothing sensitive", async () => {
  const res = await request(app).get("/ping");
  assert.strictEqual(res.status, 200);
  assert.ok(!res.text.includes(SECRET));
});

test("secretMatches handles missing and odd input without throwing", () => {
  assert.strictEqual(secretMatches(SECRET, undefined), false);
  assert.strictEqual(secretMatches(SECRET, ""), false);
  assert.strictEqual(secretMatches(SECRET, ["array"]), false);
  assert.strictEqual(secretMatches(SECRET, SECRET), true);
});
