# Skipper Roadmap — Known Issues & Infrastructure Improvements

## SHA Bug (github_read / github_write)

**Problem:** `github_read` returns file content but not the SHA. GitHub requires the current SHA to overwrite an existing file. Without it, `github_write` gets a 409 conflict error and the update fails.

**Fix:** Update `github_read` to return both `content` and `sha` in its response.

**Robustness upgrade:** Build a read-before-write pattern into `github_write` — if no SHA is provided and the file exists, auto-fetch the SHA first, then proceed. Caller never has to think about it.

**Blocked by:** Skipper source code not in GitHub — can't edit the tool definitions remotely yet.

---

## Skipper Can't Operate on Itself

**Problem:** If a Skipper tool is broken, the only path to fix it runs through Skipper. The mechanic's only wrench is the broken one.

**Root cause:** Skipper source code lives only on the droplet. No external path in exists.

**Remedy — three layers:**

### Layer 1 (Short term) — Bootstrap webhook
A simple deploy script on the droplet triggered by SSH or a secure webhook, completely outside Skipper's tool chain. Hit the endpoint, it pulls and restarts. Skipper not involved.

### Layer 2 (Medium term) — Source code to GitHub
Push Skipper source files from the droplet to a private GitHub repo. Then Skipper can read and write its own code through `github_read`/`github_write`, and `pm2_restart` deploys the change. Self-modification through a neutral third party — safe, auditable, reversible.

**This is the right next step.** One MacBook session: SSH in, locate Skipper source, push to private repo. Permanent fix.

### Layer 3 (Long term) — Skipper Admin process
A separate lightweight process on the droplet with one job: accept signed commands to update and restart Skipper. Completely isolated. Can't be hijacked by a broken Skipper tool. The nuclear option if Layer 2 ever fails.

---

## Action Items

- [ ] SSH into droplet, locate Skipper source files (`/home/...` or wherever PM2 is running it from)
- [ ] Push source to private GitHub repo (`skipper-core` or similar)
- [ ] Fix `github_read` to return SHA
- [ ] Add read-before-write fallback to `github_write`
- [ ] Restart Skipper via `pm2_restart` to deploy fixes
- [ ] Verify SHA bug resolved with a test overwrite

---

## Notes
- Skipper PM2 process has 8 restarts — worth investigating why after source is accessible
- Do this on MacBook, not mobile
