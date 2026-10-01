# SHIP-GATE.md — "Did it actually work?"

Owner: John (Bitwerx Labs). Builder: Claude. Reviewer: Grok.
Status: spec v1, not built. Location: johnrspivey/Orbit-phoenix-/SHIP-GATE.md

## The problem
Work now gets built while John is on the road and can't read code.
He needs a trustworthy yes/no on every change before anything ships,
readable on a phone in ten seconds.

## Not a new system
This extends the existing **monitoring + alert loop** (one of the five
reusable Bitwerx systems): `/root/watchdog.sh` on the droplet + the ntfy
alert topic. Same alert channel, same habit. No new app.

It also absorbs the pending CATALOG item "Health monitoring — /health +
UptimeRobot + Telegram." Use the watchdog + ntfy setup already running
instead of adding UptimeRobot and Telegram as a second alert path.

## Three layers

### 1. Code tests (every change)
- Each repo gets a `tests/` folder and one command that runs them all.
- Tests run automatically on every push (GitHub Actions).
- Tests are written **from the spec file (HANDOFF.md / ROUTE.md), not from
  the code**, so they check what John asked for, not what got built.
- A change is not "done" until its tests pass. Claude doesn't report done
  on a red result.

### 2. Live checks (after every deploy, and on the watchdog schedule)
- For each live product: load the main page and hit one or two key
  endpoints; confirm the expected response.
- Added to `watchdog.sh` so broken products get caught even when nothing
  changed (expired keys, crashed processes, lapsed domains).

### 3. One plain-English report
Sent to ntfy. Examples:
- `Missed Call Text Back — 14/14 checks passed. Safe to ship.`
- `Missed Call Text Back — FAILED 1/14: caller's reply did not reach the
  owner's phone. Not shipped.`
No stack traces in the alert. Details live in the repo for Claude to read.

## First target: Missed Call Text Back
It already has a mock mode with zero vendor spend, which makes it ideal.
End-to-end tests in mock mode:
1. Missed call → first-contact SMS written to the log within seconds
2. Unknown `To` number → no SMS, logged as unmatched
3. Caller replies → reply forwarded to owner with caller's number
4. Second missed call inside cooldown → no duplicate SMS
5. STOP → no further texts; START → texts resume; HELP → help reply
6. Opt-out is per business, not global
7. `PROVIDER=twilio` with any credential blank → refuses to start, names
   what's missing
8. Admin pages require login when `PROVIDER=twilio`

## Grok's role
Grok reviews the test list against the spec and flags any promise in the
spec that has no test. That's the cross-check: Grok checks coverage,
Claude writes and runs the tests.

## Rollout
1. Missed Call Text Back (mock mode)
2. Live checks for every product already deployed
3. Each new build ships with tests from day one

## Open items
- Whether GitHub Actions minutes are enough on John's plan (check before
  adding many repos)
