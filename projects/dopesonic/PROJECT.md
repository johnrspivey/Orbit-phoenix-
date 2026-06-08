# DopeSonic — PROJECT.md

## The Big Picture
DopeSonic is the music vertical of Bitwerx Labs — a suite of AI-powered tools for people who make and experience music. It lives at dopesonic.pro and is the home for everything music-related under the Bitwerx umbrella.

Two sides of the same coin:
- **Makers** — tools for guitarists, vocalists, producers building their sound
- **Listeners** — tools for people who want to go deeper into the music they love

---

## Live Products

### Pathfinder (Guitar Tone Advisor)
AI-powered guitar tone advisor. Player describes their sound or target tone, AI helps them get there — gear recommendations, settings, technique. Built and deployed.

### VocalPath
AI vocal advisor. Singers describe their style, goals, or challenges — AI guides them toward technique, training approaches, and sound development. Built and deployed.

---

## In Development / Concept

### Drums & Bass Advisor
Same pattern as Pathfinder and VocalPath — AI advisor for drummers and bass players. Concept stage only, no code yet.

### Green Room
Venue directory for independent musicians. Finding places to play, contacts, what the room is like, what it pays. Separate concept, may spin out independently. No code yet.

### Collabos
Platform connecting independent musicians for collaboration. Not a social network — a working matchmaker. Find someone who plays what you need, make something together.

**Endorsement targets:**
- **Tom MacDonald** — top priority. Independent artist who tried the industry, left on his own terms, outworked everyone without compromising. His ethos is a direct match for what Collabos represents. Audience is fiercely loyal and skews toward people who distrust gatekeepers. Pursue when Collabos is far enough along for a serious pitch.

---

## Companion Product (Music Vertical)

### Groupie (separate product, same vertical)
AI music listening companion. Source-agnostic — works with Spotify, Apple Music, YouTube, vinyl, anything. Core value: an interactive conversation partner as obsessed with the music as you are. Knows the band drama, the recording history, the tour stories, the lineup changes. You put something on and say "tell me about this" — it's off to the races.

Not a journal app. A companion. The friend who already knows everything and is sitting right there with you.

- Pre-listen priming: artist context, what to listen for
- Real-time conversation during listening
- Post-listen debrief
- Personal listening journal built from sessions
- Reasoned discovery recommendations

Tagline: *"Obsessively into your music."*
Freemium. Elevated roster priority — high adoption potential flagged.
No code yet.

DopeSonic is for makers. Groupie is for listeners. Together they own the music vertical.

---

## Infrastructure
- **Domain:** dopesonic.pro
- **Stack:** Vite/React frontend, deployed on DigitalOcean droplet (167.99.7.190) via Nginx + PM2
- **DNS:** A records in Namecheap pointing to 167.99.7.190 — confirm status
- **SSL:** Let's Encrypt — pending confirmation after DNS resolves

---

## Open Items
- [ ] Confirm DNS is resolving correctly for dopesonic.pro
- [ ] Complete SSL setup via Let's Encrypt
- [ ] Build out Drums & Bass Advisor
- [ ] Flesh out Green Room concept
- [ ] Begin Collabos feature spec
- [ ] Begin Groupie V1 spec (3 screens: session start, reaction capture, debrief)
- [ ] Reach out to Tom MacDonald's team when Collabos is pitch-ready

---

## Business Model
- Freemium across all tools
- Paid tiers for depth: history, export, deeper AI context
- Collabos may have a marketplace/commission model
- White label path available when products mature

---

## Status
Pathfinder and VocalPath live. Everything else concept or in progress. June 2026.

## Related
- Groupie (listener companion — same vertical, separate product)
- Cholo Chihuahuas (audio production overlap — Ableton, original music)
- Bitwerx YouTube channel (DopeSonic content is natural fit)
