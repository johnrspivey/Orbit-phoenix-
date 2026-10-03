const { test } = require("node:test");
const assert = require("node:assert");
const { spawn, spawnSync } = require("child_process");
const path = require("path");
const { SECRET } = require("./helpers");

const SERVER = path.join(__dirname, "..", "server.js");

function envWithout(extra) {
  const env = { ...process.env, ...extra };
  if (!("SKIPPER_SECRET" in extra)) delete env.SKIPPER_SECRET;
  return env;
}

test("server refuses to start when SKIPPER_SECRET is missing", () => {
  const r = spawnSync(process.execPath, [SERVER], { env: envWithout({ PORT: "0" }), encoding: "utf8", timeout: 10000 });
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /refusing to start: SKIPPER_SECRET is not set/);
});

test("server refuses to start when SKIPPER_SECRET is shorter than 32 characters", () => {
  const short = "a".repeat(31);
  const r = spawnSync(process.execPath, [SERVER], { env: envWithout({ PORT: "0", SKIPPER_SECRET: short }), encoding: "utf8", timeout: 10000 });
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /at least 32 characters/);
  assert.ok(!r.stderr.includes(short), "the bad secret itself is not printed");
});

test("with a good secret it listens on 127.0.0.1 only, and its output never shows the secret", async () => {
  const child = spawn(process.execPath, [SERVER], { env: envWithout({ PORT: "0", SKIPPER_SECRET: SECRET }) });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  try {
    const port = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("server did not start: " + out)), 10000);
      child.stdout.on("data", () => {
        const m = out.match(/Skipper running on (\S+):(\d+)/);
        if (m) { clearTimeout(t); assert.strictEqual(m[1], "127.0.0.1"); resolve(Number(m[2])); }
      });
      child.on("exit", (code) => reject(new Error("server exited " + code + ": " + out)));
    });
    const res = await fetch("http://127.0.0.1:" + port + "/mcp/" + SECRET, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    assert.strictEqual(res.status, 200);
    await res.text();
    const bad = await fetch("http://127.0.0.1:" + port + "/mcp/wrong", { method: "POST" });
    assert.strictEqual(bad.status, 401);
    await new Promise((r) => setTimeout(r, 100));
    assert.ok(out.includes("/mcp/[redacted]"));
    assert.ok(!out.includes(SECRET), "secret appeared in server output");
  } finally {
    child.kill();
  }
});
