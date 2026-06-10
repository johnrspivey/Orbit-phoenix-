# SKIPPER MIGRATION — SSH Session Checklist
## One-time task: move Skipper's source to GitHub and unlock self-repair
## Paste-ready. Run top to bottom. ~20 minutes.

---

## BEFORE YOU SSH (on github.com, 1 minute)

1. Go to **github.com/new**
2. Repo name: **skipper** — set visibility to **Private**
3. Do NOT add a README or .gitignore (repo must be empty)
4. Create repo

---

## STEP 1 — Connect

```bash
ssh root@167.99.7.190
```

---

## STEP 2 — Find Skipper's home

```bash
pm2 list
```

Note Skipper's exact process name (probably `skipper`). Then:

```bash
pm2 info skipper | grep "exec cwd"
```

That path is Skipper's folder. Go there (replace with the real path):

```bash
cd /path/from/above
ls -la
```

Confirm you see Skipper's source files (index.js or server.js, package.json).

---

## STEP 3 — Protect secrets BEFORE git ever runs

```bash
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.pm2/
EOF
```

Verify the .env (or wherever tokens live) is named in .gitignore.
If tokens are hardcoded in the source instead of a .env — STOP,
flag it to Claude, we fix that first. Never push tokens.

---

## STEP 4 — Init and push

```bash
git init
git add .
git status
```

**READ the git status output. If .env or anything with a token appears
in the staged list, stop and remove it (`git rm --cached .env`).**

```bash
git commit -m "Skipper v1 — initial source import"
git branch -M main
git remote add origin https://github.com/johnrspivey/skipper.git
git push -u origin main
```

If push asks for auth: username `johnrspivey`, password = a GitHub
**Personal Access Token** (not your password). Use the existing PAT
or make one at github.com/settings/tokens with `repo` scope.

---

## STEP 5 — Tag the known-good version (Lifeboat's anchor)

```bash
git tag stable-v1
git push origin stable-v1
```

---

## STEP 6 — Verify

On your phone or laptop browser: github.com/johnrspivey/skipper
should show the full source. Confirm NO .env / no tokens visible.

---

## DONE — what this unlocks

- Skipper source survives droplet death
- Claude can read/edit Skipper's own code via github_read/write
- Next batch (written by Claude, deployed via git pull):
  1. SHA fix for github_read/github_write
  2. self_update tool (git pull -> node --check -> restart)
  3. Lifeboat watchdog process
  4. github_create_repo tool
  5. send_email tool

## Rollback insurance

Nothing in this checklist changes running code. Skipper keeps running
untouched the entire time. Worst case: delete the GitHub repo and
nothing happened.
