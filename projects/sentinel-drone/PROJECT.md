# Sentinel Drone — PROJECT.md

## Concept
AI-assisted drone patrol system that delivers plain-language tipoffs about concerning activity to a security operator or small team. No live video. No image processing. Text-based alerts only at MVP.

## Core Value Prop
A drone patrols an area on a schedule or on-demand. When it detects something worth flagging — based on sensors, telemetry, or simple threshold triggers — it sends a human-readable alert to whoever is watching. The AI layer translates raw signal into plain language: "Movement detected near north fence line, 11:42 PM" or "Vehicle parked in restricted zone for 18 minutes."

## MVP Scope (V1)
- Single drone, single operator
- Drone completes a patrol route and reports back
- Trigger conditions are simple and pre-defined (TBD — examples below)
- Alert delivery: SMS or Slack message, plain English
- No video, no images, no live feed
- AI layer (Orbit/Skipper/Claude API) formats the alert from raw telemetry

## Trigger Conditions (TBD — starting list)
- Motion detected in a defined zone
- Unexpected object or vehicle in a known-clear area
- Patrol route deviation or obstacle encountered
- Loiter detection (something stationary that wasn't there before)
- Time-of-day anomaly (activity at unusual hours)
- Drone battery/signal anomaly (safety alert)

## Alert Output Format (MVP)
Plain SMS or Slack push. Example:
> "SENTINEL ALERT — 11:42 PM | North perimeter | Motion detected, unknown origin. Drone returning to home position."

## Tech Stack (Hypothetical MVP)
- Drone: DJI or Skydio with SDK/webhook support (Ford Pro partnership is enterprise-tier, not V1)
- Telemetry bridge: lightweight middleware (Node or Python) parsing drone events
- AI layer: Claude API via Netlify serverless function — formats alert from event payload
- Delivery: Twilio (SMS) or Slack webhook
- Command layer: Orbit/Skipper for scheduling, status, and operator queries

## Open Questions
- What drone platform has the most accessible dev API at hobbyist/small business tier?
- What exactly constitutes a "concerning" event — needs operator input per deployment
- FAA compliance path for autonomous patrol (Part 107, BVLOS rules)
- Is the AI layer formatting alerts, or also making triage decisions?
- Single-site product vs. multi-site SaaS?

## Business Model (Early Thinking)
- B2B: small property owners, marinas, farms, construction sites, storage facilities
- Subscription per site or per drone
- Operator dashboard is a later phase — V1 is pure alert delivery
- Not a consumer product

## Status
Concept. No code. Idea captured June 2026.

## Related
- Orbit / Skipper MCP (command layer)
- MOO (competitive intelligence — different domain but similar alert-dispatch pattern)
- BOLO (Bluetooth tracker — overlapping security theme)
