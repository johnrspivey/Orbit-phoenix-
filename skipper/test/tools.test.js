const { test, mock } = require("node:test");
const assert = require("node:assert");
const childProcess = require("child_process");
const { createApp } = require("../app");
const { parseRpc, callTool, SECRET } = require("./helpers");

function setup() {
  const execFile = mock.fn((file, args, opts, cb) => cb(null, "", ""));
  const http = { post: mock.fn(async () => ({})), get: mock.fn(), put: mock.fn() };
  // If anything reaches for a shell-based API, these spies will record it.
  const shellSpies = ["exec", "execSync", "spawn", "spawnSync", "execFileSync"].map((m) =>
    mock.method(childProcess, m, () => { throw new Error("shell API called: " + m); })
  );
  const app = createApp({ secret: SECRET, execFile, http, log: () => {}, logError: () => {} });
  const done = () => {
    for (const s of shellSpies) assert.strictEqual(s.mock.callCount(), 0, "a shell API was called");
    mock.restoreAll();
  };
  return { app, execFile, http, done };
}

for (const bad of ["content-quarry-api; touch /tmp/pwned", "skipper", "", "content-quarry-api ", "$(reboot)", "all"]) {
  test("pm2_restart rejects " + JSON.stringify(bad) + " without running anything", async () => {
    const { app, execFile, done } = setup();
    const res = await callTool(app, "pm2_restart", { name: bad });
    const result = parseRpc(res).result;
    assert.strictEqual(result.isError, true);
    assert.match(result.content[0].text, /Refused/);
    assert.strictEqual(execFile.mock.callCount(), 0);
    done();
  });
}

for (const good of ["content-quarry-api", "gig-pig-api", "gig-pig-frontend"]) {
  test("pm2_restart allows " + good + " via execFile with an argument array (no shell)", async () => {
    const { app, execFile, done } = setup();
    const res = await callTool(app, "pm2_restart", { name: good });
    const result = parseRpc(res).result;
    assert.ok(!result.isError);
    assert.strictEqual(result.content[0].text, "Restarted " + good);
    assert.strictEqual(execFile.mock.callCount(), 1);
    const [file, args, opts, cb] = execFile.mock.calls[0].arguments;
    assert.strictEqual(file, "pm2");
    assert.deepStrictEqual(args, ["restart", good]);
    assert.strictEqual(typeof cb, "function");
    assert.deepStrictEqual(Object.keys(opts), ["env"], "only env is set, so no shell:true");
    done();
  });
}

test("the real default for execFile is child_process.execFile, not exec", () => {
  const src = require("fs").readFileSync(require.resolve("../app"), "utf8");
  assert.match(src, /options\.execFile\|\|childProcess\.execFile/);
  assert.doesNotMatch(src, /childProcess\.exec\(|\bexec\(|execSync|shell\s*:/);
});

test("pm2_status also uses execFile", async () => {
  const { done } = setup();
  const execFile = mock.fn((file, args, opts, cb) =>
    cb(null, JSON.stringify([{ name: "x", pm2_env: { status: "online", restart_time: 0 }, monit: { memory: 1048576, cpu: 1 } }]), "")
  );
  const app = createApp({ secret: SECRET, execFile, log: () => {}, logError: () => {} });
  const result = parseRpc(await callTool(app, "pm2_status", {})).result;
  assert.deepStrictEqual(execFile.mock.calls[0].arguments.slice(0, 2), ["pm2", ["jlist"]]);
  assert.match(result.content[0].text, /"online"/);
  done();
});

const badHooks = [
  "https://evil.example.com/build_hooks/abc",
  "http://api.netlify.com/build_hooks/abc",
  "https://api.netlify.com/api/v1/sites",
  "https://api.netlify.com.evil.com/build_hooks/abc",
  "https://api.netlify.com@evil.com/build_hooks/abc",
  "https://api.netlify.com:8443/build_hooks/abc",
  "file:///etc/passwd",
  "http://127.0.0.1:3400/mcp",
  "",
  // encoded characters or backslashes in the hook path
  "https://api.netlify.com/build_hooks/%2e%2e/api/v1/sites",
  "https://api.netlify.com/build_hooks/abc%2Fdeploys",
  "https://api.netlify.com/build_hooks/%61bc",
  "https://api.netlify.com/build_hooks/abc%",
  "https://api.netlify.com/build_hooks/..\\..\\api/v1/sites",
  "https://api.netlify.com/build_hooks/../api/v1/sites",
  "https://api.netlify.com/build_hooks/abc/extra",
  // query options other than trigger_title
  "https://api.netlify.com/build_hooks/abc123?trigger_branch=evil",
  "https://api.netlify.com/build_hooks/abc123?trigger_title=x&trigger_branch=evil",
  "https://api.netlify.com/build_hooks/abc123?trigger_branch=evil&trigger_title=x",
  "https://api.netlify.com/build_hooks/abc123?trigger%5Fbranch=evil",
  "https://api.netlify.com/build_hooks/abc123?TRIGGER_BRANCH=evil",
  "https://api.netlify.com/build_hooks/abc123?clear_cache=true",
  "https://api.netlify.com/build_hooks/abc123?trigger_title=a;trigger_branch=evil",
  "https://api.netlify.com/build_hooks/abc123?trigger_title=a&trigger_title=b",
  "https://api.netlify.com/build_hooks/abc123?foo",
];
for (const hook of badHooks) {
  test("netlify_deploy rejects " + JSON.stringify(hook), async () => {
    const { app, http, done } = setup();
    const result = parseRpc(await callTool(app, "netlify_deploy", { hook_url: hook })).result;
    assert.strictEqual(result.isError, true);
    assert.strictEqual(http.post.mock.callCount(), 0);
    done();
  });
}

test("netlify_deploy accepts a real Netlify build hook", async () => {
  const { app, http, done } = setup();
  const hook = "https://api.netlify.com/build_hooks/5f1e2d3c4b5a69788796a5b4";
  const result = parseRpc(await callTool(app, "netlify_deploy", { hook_url: hook })).result;
  assert.ok(!result.isError);
  assert.strictEqual(result.content[0].text, "Deploy triggered.");
  const [url, body, config] = http.post.mock.calls[0].arguments;
  assert.strictEqual(url, hook);
  assert.strictEqual(body, undefined);
  assert.strictEqual(config.maxRedirects, 0, "redirects must not be followed");
  done();
});

test("netlify_deploy still allows a query string on a valid hook", async () => {
  const { app, http, done } = setup();
  const hook = "https://api.netlify.com/build_hooks/abc123?trigger_title=skipper";
  const result = parseRpc(await callTool(app, "netlify_deploy", { hook_url: hook })).result;
  assert.ok(!result.isError);
  assert.strictEqual(http.post.mock.callCount(), 1);
  done();
});

for (const hook of [
  "https://api.netlify.com/build_hooks/abc123",
  "https://api.netlify.com/build_hooks/abc123?",
  "https://api.netlify.com/build_hooks/abc123?trigger_title=Deployed%20by%20Skipper",
]) {
  test("netlify_deploy allows " + JSON.stringify(hook), async () => {
    const { app, http, done } = setup();
    const result = parseRpc(await callTool(app, "netlify_deploy", { hook_url: hook })).result;
    assert.ok(!result.isError, JSON.stringify(result));
    assert.strictEqual(http.post.mock.callCount(), 1);
    done();
  });
}

test("pm2 gets only PATH, HOME and PM2_HOME, never SKIPPER_SECRET or GITHUB_TOKEN", async () => {
  const saved = { ...process.env };
  Object.assign(process.env, {
    SKIPPER_SECRET: SECRET, GITHUB_TOKEN: "ghp_should_not_leak", OTHER_SETTING: "nope",
    PATH: "/usr/bin:/bin", HOME: "/root", PM2_HOME: "/root/.pm2",
  });
  try {
    const { app, execFile, done } = setup();
    await callTool(app, "pm2_restart", { name: "gig-pig-api" });
    await callTool(app, "pm2_status", {});
    assert.strictEqual(execFile.mock.callCount(), 2);
    for (const call of execFile.mock.calls) {
      const env = call.arguments[2].env;
      assert.deepStrictEqual(env, { PATH: "/usr/bin:/bin", HOME: "/root", PM2_HOME: "/root/.pm2" });
      assert.ok(!("SKIPPER_SECRET" in env) && !("GITHUB_TOKEN" in env));
      assert.ok(!JSON.stringify(env).includes(SECRET) && !JSON.stringify(env).includes("ghp_should_not_leak"));
    }
    done();
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
  }
});

test("pm2 env leaves out PM2_HOME when it isn't set (pm2 then uses ~/.pm2)", () => {
  const { pm2Env } = require("../app");
  assert.deepStrictEqual(pm2Env({ PATH: "/bin", HOME: "/h", GITHUB_TOKEN: "x" }), { PATH: "/bin", HOME: "/h" });
});
