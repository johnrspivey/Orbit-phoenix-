# SKIPPER OPS BRIEF

*Last updated: June 7, 2026*

---

## What Skipper Is

A custom MCP server running at `skipper.gigpig.online` connected directly to Claude. Five tools callable mid-conversation without any terminal, dashboard, or phone fumbling. Claude can execute ops tasks as part of a natural conversation.

---

## Current Tool Stable (Live)

| Tool | What It Does |
|---|---|
| `github_read` | Read any file from any repo |
| `github_write` | Write/commit any file to any repo |
| `netlify_deploy` | Trigger a Netlify deploy via webhook |
| `pm2_status` | Get live status of all PM2 processes on the droplet |
| `pm2_restart` | Restart any PM2 process by name |

**Covered products right now:** Gig Pig, Content Quarry (PM2), The Ruling Class Report, Nomad Sleep, 850420.com, any Netlify-deployed site (GitHub + deploy).

---

## Expansion Plan

### Phase 1 — Supabase
- Query any table (read feedback, check signups, pull counts)
- Insert / update rows
- Check auth users
- Run SQL via Management API
- **Unlock:** Full debug loop — describe a data bug, Claude queries, finds it, fixes code, commits, deploys

### Phase 2 — Stripe
- Pull recent charges and failed payments
- Check subscription status per customer
- List products and prices
- Trigger refunds / cancellations
- **Unlock:** Revenue snapshots on demand. Paywall enforcement debugging without opening the dashboard.

### Phase 3 — Netlify API (beyond deploy hooks)
- Read/write environment variables
- Pull build logs
- Check deploy history and failure reasons
- **Unlock:** Claude sets env vars before triggering deploy. Build failures become self-diagnosing.

### Phase 4 — Cloudflare
- DNS record read/write (A, CNAME, TXT)
- Zone and SSL status
- Cache purge
- **Unlock:** New site deployed → DNS pointed → SSL confirmed, all in one conversation.

### Phase 5 — Namecheap
- Domain list and expiration dates
- Nameserver updates
- DNS management (if not using Cloudflare DNS)
- **Unlock:** Expiration monitoring across entire domain portfolio. Never lose a domain to a missed renewal.

---

## Full Loop (After All Phases)

> Describe a problem or feature in chat → Claude reads current code from GitHub → queries Supabase if data is involved → checks Stripe if billing is involved → writes the fix → commits it → sets env vars in Netlify → deploys → reads build log to confirm → points DNS via Cloudflare if needed

End-to-end software deployment from a phone conversation while driving. No laptop, no dashboard tabs, no copy-pasting keys.

---

## Health Monitoring — MUST HAVE

### The Problem
Skipper is a single point of failure for the entire ops layer. If `skipper.gigpig.online` goes down, all of the above is unavailable.

### The Solution

**1. Health endpoint on Skipper**
Add a `/health` route returning:
```json
{ "status": "ok", "timestamp": "2026-06-07T10:00:00.000Z" }
```
Optionally extend to report PM2 process health, Supabase reachability, GitHub connectivity.

**2. External uptime monitor (UptimeRobot — free tier)**
- Hits `/health` every 5 minutes
- Sends alert via Telegram (@Bitwerxbot) on failure
- Must be external — if the droplet dies, an internal cron dies with it
- Free for up to 50 monitors

**3. Monitor everything while you're there**
Add all active products to UptimeRobot at setup time:
- `skipper.gigpig.online/health`
- `gigpig.online`
- `contentquarry.gigpig.online`
- `nomadsleep.netlify.app`
- `therulingclassreport.com`
- `bitwerxlabs.com`
- `dopesonic.pro`
- `850420.com`

One dashboard. Every product. You know before a user does.

### Build Order
1. Add `/health` endpoint to Skipper (5-line Express route)
2. Create UptimeRobot account, add Telegram alert channel
3. Add all monitors
4. Verify alert fires on test failure

---

## ICM Integration

Skipper enables ICM pipelines to become agentic:
- Stage output generated in conversation → committed directly to the correct repo folder via `github_write`
- No manual relay — Claude is the pipeline runner
- `PROJECT.md` and `SESSION_LOG.md` files maintainable at end of every session without touching GitHub mobile

---

## What Skipper Cannot Do Yet

- Supabase (Phase 1)
- Stripe (Phase 2)
- Netlify env vars / build logs (Phase 3)
- Cloudflare DNS (Phase 4)
- Namecheap domain management (Phase 5)
- Domain *purchase* — always requires human confirmation before money moves
