# Sentinel Drone — PROJECT.md

## Concept
An AI command layer that orchestrates any drone — regardless of capability — into a unified fleet with purpose. Sentinel doesn't require drones to be smart. It assigns them roles and coordinates their behavior. The intelligence lives in the system, not the hardware.

## Core Philosophy
Any drone that can receive a flight signal belongs in the fleet. Capability determines role, not eligibility. A $30 toy with no camera and no telemetry is still an asset. Sentinel puts it to work.

---

## The Three Roles

### 1. Observers
Drones with sensors, cameras, or telemetry that can report back to Sentinel. These are the eyes. When something happens, they generate the data that becomes a plain-language alert to the operator.

- Requires: GPS, SDK or MAVLink access, some form of data return
- Examples: DJI Enterprise, Autel EVO, Parrot ANAFI, ArduPilot/PX4 builds
- Output: trigger events → AI formats → SMS/Slack alert to operator

### 2. Decoys
Drones with no sensors, no camera, no data link — receive-only. They fly patterns. They hover. They move. To anyone on the ground they are indistinguishable from Observers. They create uncertainty about what is and isn't watching.

- Requires: nothing beyond the ability to receive flight commands
- Examples: any toy or RC drone with stable hover
- Output: presence only — psychological effect, not data

### 3. Signalers
Drones used to communicate through movement and behavior. Not reporting back to the operator — communicating outward to people on the ground or directing other assets. A drone that flies toward something is saying something. A drone that hovers and then retreats is saying something else. Behavior is the language.

- Requires: reliable flight control, reasonable maneuverability
- Examples: mid-range RC or entry consumer drones
- Output: behavioral signals — leading, warning, directing, acknowledging

---

## What Sentinel Controls
Sentinel sends flight instructions. It doesn't need to receive anything back from Decoys or Signalers. The system knows what it told them to do. That's enough.

For Observers, Sentinel listens for trigger events and routes them through the AI layer for alert formatting.

---

## Alert System (Observer output)
Plain SMS or Slack push. Example:
> "SENTINEL ALERT — 11:42 PM | North perimeter | Motion detected, unknown origin. Observer returning to home."

No video. No images. Text only at MVP.

## MVP Scope (V1)
- Mixed fleet: at least one Observer, any number of Decoys or Signalers
- Single operator
- Sentinel assigns roles, schedules routes, sends flight commands
- Observer triggers generate plain-language alerts via Claude API
- Alert delivery: Twilio SMS or Slack webhook

## Tech Stack (Hypothetical MVP)
- Flight control bridge: MAVLink or platform SDK (one integration layer, many drone types)
- AI layer: Claude API via Netlify serverless function
- Delivery: Twilio or Slack webhook
- Command layer: Orbit/Skipper for scheduling, fleet status, operator queries

## Autonomous Recharging (Future)
Drone docks exist today (DJI Dock 2, Percepto, Easy Aerial SAMS) — auto land, charge, relaunch. V1 doesn't require it but the architecture must not block it. Full autonomous patrol with zero human intervention is the long-term mode.

## Open Questions
- What RC/toy drone protocols can be bridged to a software command layer?
- What does a Signaler behavior library look like? (approach, hover, retreat, circle, follow)
- FAA compliance path for mixed autonomous fleets
- Liability when an Observer alert is missed or wrong
- Single-site product vs. multi-site SaaS?

## Business Model (Early Thinking)
- B2B: marinas, farms, construction sites, storage facilities, event security
- Subscription per site or per fleet
- Operator dashboard is a later phase — V1 is alert delivery + fleet scheduling
- Not a consumer product

## Status
Concept. No code. Idea captured June 2026.

## Related
- Orbit / Skipper MCP (command layer)
- BOLO (Bluetooth tracker — overlapping security theme)
- MOO (alert-dispatch pattern overlap)
