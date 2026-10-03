const { test } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const { createApp, redactUrl } = require("../app");
const { SECRET, rpc } = require("./helpers");

const listTools = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };

test("request log never contains the secret, whichever way it is sent", async () => {
  const lines = [];
  const capture = (...a) => lines.push(a.map(String).join(" "));
  const app = createApp({ secret: SECRET, log: capture, logError: capture });

  await rpc(app, "/mcp/" + SECRET, listTools);
  await rpc(app, "/MCP/" + SECRET, listTools);
  await rpc(app, "/mcp/" + SECRET + "/", listTools);
  await rpc(app, "/mcp/" + SECRET + "?x=" + SECRET, listTools);
  await rpc(app, "/mcp", listTools, { "x-skipper-secret": SECRET });
  await rpc(app, "/mcp/" + SECRET + "/extra/path", listTools);
  await rpc(app, "/other/" + SECRET, listTools);
  await rpc(app, "/other/" + encodeURIComponent(SECRET).replace(/t/g, "%74"), listTools);
  await request(app).post("/mcp/" + SECRET).set("Content-Type", "application/json").send("{bad json");
  await request(app).get("/ping?s=" + SECRET);

  assert.ok(lines.length >= 10, "requests were logged");
  for (const line of lines) assert.ok(!line.includes(SECRET), "secret leaked into log line: " + line);
  assert.ok(lines.some((l) => l.includes("/mcp/[redacted]")), "path requests are still logged, redacted");
});

test("redactUrl keeps harmless URLs readable", () => {
  assert.strictEqual(redactUrl("/ping", SECRET), "/ping");
  assert.strictEqual(redactUrl("/mcp", SECRET), "/mcp");
  assert.strictEqual(redactUrl("/mcp/abc?q=1", SECRET), "/mcp/[redacted]");
});
