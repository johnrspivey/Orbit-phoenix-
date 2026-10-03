const { test, mock } = require("node:test");
const assert = require("node:assert");
const { createApp } = require("../app");
const { parseRpc, callTool, SECRET } = require("./helpers");

function setup() {
  const http = {
    get: mock.fn(async () => ({ data: { content: Buffer.from("hi").toString("base64"), sha: "abc" } })),
    put: mock.fn(async () => ({ data: { commit: { sha: "def" } } })),
    post: mock.fn(),
  };
  const app = createApp({ secret: SECRET, http, githubToken: "tok", log: () => {}, logError: () => {} });
  return { app, http };
}

const W = { owner: "johnrspivey", repo: "Orbit-phoenix-", content: "x", message: "m" };

// Each of these would otherwise turn a "write a file" call into a different GitHub API call.
const attacks = {
  // Collaborator attack: climb out of /contents/ and PUT /repos/:o/:r/collaborators/:user
  "collaborator via path ..": { ...W, path: "../collaborators/attacker" },
  "collaborator via path ../..": { ...W, path: "a/../../collaborators/attacker" },
  "collaborator via %2e%2e": { ...W, path: "%2e%2e/collaborators/attacker" },
  "collaborator via %2E%2E%2F": { ...W, path: "%2E%2E%2Fcollaborators%2Fattacker" },
  "collaborator via double-encoded %252e%252e": { ...W, path: "%252e%252e/collaborators/attacker" },
  "collaborator via backslash": { ...W, path: "..\\collaborators\\attacker" },
  "collaborator via %5c": { ...W, path: "x%5c..%5ccollaborators" },
  "collaborator via repo field": { ...W, repo: "Orbit-phoenix-/collaborators/attacker#", path: "x" },
  "collaborator via repo %2f": { ...W, repo: "Orbit-phoenix-%2fcollaborators%2fattacker", path: "x" },
  // Pull-merge attack: PUT /repos/:o/:r/pulls/:n/merge
  "pull-merge via path ..": { ...W, path: "../pulls/1/merge" },
  "pull-merge via %2e%2e%2f": { ...W, path: "%2e%2e%2fpulls%2f1%2fmerge" },
  "pull-merge via repo ..": { ...W, repo: "..", path: "Orbit-phoenix-/pulls/1/merge" },
  "pull-merge via repo with slash": { ...W, repo: "Orbit-phoenix-/pulls/1/merge?", path: "x" },
  "pull-merge via mixed encoding": { ...W, path: ".%2e/pulls/1/merge" },
  // Other owners
  "other owner": { ...W, owner: "attacker", path: "README.md" },
  "owner case trick": { ...W, owner: "JohnRSpivey", path: "README.md" },
  "owner with path": { ...W, owner: "johnrspivey/../attacker", path: "README.md" },
  // Junk
  "malformed encoding": { ...W, path: "a%zz/b" },
  "empty path": { ...W, path: "" },
  "dot segment": { ...W, path: "./README.md" },
  "empty segment": { ...W, path: "a//b" },
};

for (const [label, args] of Object.entries(attacks)) {
  test("github_write blocks " + label, async () => {
    const { app, http } = setup();
    const result = parseRpc(await callTool(app, "github_write", args)).result;
    assert.strictEqual(result.isError, true, JSON.stringify(result));
    assert.strictEqual(http.put.mock.callCount(), 0, "no request reached GitHub");
  });
  test("github_read blocks " + label, async () => {
    const { app, http } = setup();
    const { owner, repo, path } = args;
    const result = parseRpc(await callTool(app, "github_read", { owner, repo, path })).result;
    assert.strictEqual(result.isError, true);
    assert.strictEqual(http.get.mock.callCount(), 0);
  });
}

test("github_write to a normal file works and encodes each path segment", async () => {
  const { app, http } = setup();
  const result = parseRpc(await callTool(app, "github_write", { ...W, path: "docs/my notes?#.md" })).result;
  assert.ok(!result.isError);
  assert.strictEqual(result.content[0].text, "Committed. SHA: def");
  assert.strictEqual(http.put.mock.calls[0].arguments[0],
    "https://api.github.com/repos/johnrspivey/Orbit-phoenix-/contents/docs/my%20notes%3F%23.md");
});

test("github_read of a normal file works and returns content + sha", async () => {
  const { app, http } = setup();
  const result = parseRpc(await callTool(app, "github_read", { owner: "johnrspivey", repo: "skipper", path: "server.js" })).result;
  assert.ok(!result.isError);
  assert.deepStrictEqual(JSON.parse(result.content[0].text), { content: "hi", sha: "abc" });
  assert.strictEqual(http.get.mock.calls[0].arguments[0], "https://api.github.com/repos/johnrspivey/skipper/contents/server.js");
});

test("file names containing single dots are still fine", async () => {
  const { app, http } = setup();
  const result = parseRpc(await callTool(app, "github_write", { ...W, path: ".github/workflows/ci.yml" })).result;
  assert.ok(!result.isError);
  assert.strictEqual(http.put.mock.callCount(), 1);
});
