# RCR WikiWatchdog — Concept Brief

**Parent product:** The Ruling Class Report (therulingclassreport.com)
**Status:** Concept stage — no code yet
**Date:** July 2, 2026

## The Idea

A public-facing watchdog tool that monitors Wikipedia edit histories on politically or ideologically sensitive pages and surfaces suspicious editorial patterns — rapid reverts, edit wars, single-purpose/anonymous accounts, content quietly walked back after controversy — without editorializing on which "side" is right. The pitch is transparency, not verdicts: show the receipts, let the reader draw conclusions.

This slots naturally into RCR's existing thesis (accountability through documented evidence, "receipts" model already used elsewhere on the site) and could live as a new zone alongside the /congress tracker and museum pages.

## Why This Gap Exists

Existing tools cluster into two camps:
1. **Anti-vandalism tooling built for Wikipedia's own editors** (Huggle, Twinkle, RC Patrol, WikiLoop DoubleCheck) — powerful, but built for insiders, not a public audience, and focused on obvious vandalism rather than slow-motion ideological edit wars.
2. **Commercial brand-monitoring services** (WikiMonitoring, WikiWatch) — built for companies/executives protecting their own page reputation, paywalled, not public-interest framed.

Nothing found combines: (a) public accountability framing, (b) plain-language output for a general reader, (c) focus on ideologically contested pages rather than brand pages. That's the gap.

## Data Source

Wikipedia's MediaWiki API exposes full revision history for free — no scraping required. Key endpoints:
- `revisions` — full diff history per page, with editor, timestamp, edit summary
- `usercontribs` — all edits by a given user/IP
- Recent-changes feed — near-real-time stream of edits site-wide

This means the hard part isn't data access — it's picking a good watchlist and good anomaly signals.

## The Hard Problem: Defining "Suspicious" Without Becoming Partisan

This is the part that will make or break the tool's credibility. Candidate signals, roughly ordered from objective → interpretive:

- **Edit velocity spikes** — a page normally edited a few times a month suddenly getting edited dozens of times in a day (near-objective, easy to flag)
- **Revert wars** — same content added/removed repeatedly by different accounts in a short window (near-objective)
- **New/anonymous/single-purpose accounts** making substantive changes to contested claims (moderately objective — account age and edit count are just data)
- **Edits clustering right after the page spikes in outside news coverage** (requires correlating with external trend data — Google Trends or news APIs)
- **Language softening/hardening around specific claims** (this is where it gets genuinely hard — requires NLP judgment calls that can themselves look biased)

**Recommendation:** V1 should stick to the first three — velocity, revert wars, anonymous/new-account activity — because they're mechanically detectable and don't require the tool to judge what a "better" version of a sentence is. Leave language-sentiment analysis for a later version, if at all, and flag it clearly as more interpretive than the others.

## MVP Scope

1. Curated watchlist of pages (start small — 20-50 pages spanning genuinely contested topics from multiple political directions, not just one side, to protect credibility)
2. Scheduled poll of MediaWiki API for those pages (daily or a few times daily — no need for true real-time in v1)
3. Anomaly detection on the three near-objective signals above
4. Dashboard: page, what changed, when, by whom (account age/edit count shown, not doxxed), diff view
5. Plain-language auto-summary per flagged event ("This page was edited 14 times in 6 hours by 3 accounts created this week")
6. No verdict language — just the pattern and the data

## Stack (matches RCR's existing architecture)

- Netlify frontend (consistent with RCR, Nomad Sleep, etc.)
- Scheduled backend job (could live on the DigitalOcean droplet under PM2, same as Skipper/Content Quarry) polling MediaWiki API
- Supabase for storing flagged events and historical diffs
- Claude API for the plain-language summary generation step

## Credibility Risk (the thing that could kill this)

A watchdog tool that only ever flags edits on pages associated with one political direction will be dismissed instantly, and rightly so. The watchlist itself needs to be built with real discipline — genuinely balanced across contested topics — or the tool becomes exactly the kind of "narrative-driven" source RCR is positioned against. This is worth deciding explicitly before writing any code, not discovering after launch.

## Next Step

Draft the initial watchlist (20-50 pages) as a first artifact, before touching any code — this is the single highest-leverage decision in the whole project and costs nothing to get right early.

## Roadmap Beyond V1 (not in scope now)

Same diff-engine architecture could extend to: Federal Register/regulations.gov rule changes, congressional bill text amendments, SEC EDGAR filing revisions, Wayback Machine tracking for news/corporate site changes. Wikipedia is the right starting point because the API is free and the edit-war pattern is well understood.
