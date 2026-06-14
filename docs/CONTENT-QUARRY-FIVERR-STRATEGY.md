# Content Quarry — Fiverr Modular Gig Strategy
## Bitwerx Labs | Road Hammer | June 2026

---

## WHAT CONTENT QUARRY ACTUALLY DOES (confirmed)

- Takes any YouTube channel handle as input
- Pulls up to 50 videos via YouTube Data API
- Feeds titles + descriptions to Claude
- Returns a structured course curriculum: modules, lessons, objectives, table of contents
- Runs as Flask API on droplet (port 5002), PM2 managed, Nginx proxied
- Frontend live at contentquarry.gigpig.online
- Confirmed working against real channels (JEVanClief, nateBjones, theMITmonk)

**What it cannot do yet:**
- Niche research or topic ideation (no input = no output)
- Platform setup (WordPress, Substack, etc.)
- Editorial calendar generation
- Discovery/intake questionnaire
- Freemium paywall (first 2 modules free, rest gated)

---

## THE CORE PROBLEM WITH FIVERR GIG 1 (AI Content System)

The gig assumes a buyer who already has:
- A live blog
- Published content
- A defined niche
- A posting cadence

Most people finding it on Fiverr don't have these. They arrive earlier on the path. 
Result: vague inquiries, wasted time, no orders.

**Solution:** Don't block them — route them. Build the ladder they climb to get to you.

---

## THE FUNNEL (3 tiers, each generates revenue)

### TIER 1 — Content Forge Filter Page (free)
**Purpose:** Pre-qualify buyers before they ever message you.
**What it is:** A single page listing the prerequisites with curated links to Income School's free YouTube content for anyone missing a piece.
**Copy direction:** "Here's what you need before you need me. If you've got it, let's talk. If you don't, start here — it's free."
**Income School links to include:**
- Niche selection playlist
- Platform setup (WordPress vs Substack)
- "How long before your blog makes money" (sets expectations)
- Keyword research basics
**Call to action:** Links to Fiverr gig once they've confirmed they have the foundations.
**Time to build:** 2-3 hours. One HTML page, Netlify deploy.

---

### TIER 2 — Modular Infrastructure Gigs (paid, low-to-mid ticket)
**Purpose:** Serve buyers who aren't quite ready for the full system but will pay to close specific gaps.
**Engine:** Content Quarry + templates, lightly customized per order.

#### GIG A: "I'll build your blogging niche and content pillar plan" — $75
- Input: What they do/know/care about
- Output: Defined niche, 5 content pillars, 20 starter topic ideas
- Effort: Feed their info into Claude prompt, deliver in Notion or PDF
- Hands-on time: ~30 min per order

#### GIG B: "I'll create a 90-day editorial calendar for your blog" — $99
- Input: Niche + posting frequency
- Output: 90-day calendar, topic per post, keyword angle, CTA per post
- Effort: Claude-generated, light review
- Hands-on time: ~20 min per order

#### GIG C: "I'll build your AI research pipeline for any niche" — $149
- Input: Niche + platform (Notion, Airtable, Google Sheets)
- Output: Repeatable research workflow + prompt templates they run themselves
- Effort: Template customization
- Hands-on time: ~45 min per order

#### GIG D: "I'll turn your YouTube channel into a sellable course curriculum" — $149
- Input: YouTube channel handle
- Output: Content Quarry output — structured curriculum, modules, lessons, objectives
- Effort: Run Content Quarry, review output, deliver
- Hands-on time: ~15 min per order ← HIGHEST LEVERAGE GIG YOU HAVE
- **Freemium hook:** Show first 2 modules free in listing preview, full curriculum on order

---

### TIER 3 — Full AI Content Production System (existing Gig 1, $149/$249/$399)
**Purpose:** Buyers who have everything in place and want the full system built.
**Who arrives here:** People who either came through Tiers 1-2 or already had the foundations.
**No changes needed to this gig — just better-qualified buyers arriving.**

---

## THE DISCOVERY QUESTIONNAIRE (priority build)

**What it is:** A Claude-connected intake form that figures out where someone is on the path and routes them to the right gig automatically.

**Questions (draft):**
1. Do you have a live blog or publication? (yes/no)
2. How many posts have you published? (0 / 1-10 / 10+)
3. Have you picked a niche? (yes/working on it/no)
4. Do you have a YouTube channel? (yes/no — if yes, how many videos?)
5. What's your current biggest blogging problem? (free text → Claude interprets)

**Output:** Claude reads answers and returns:
- "You're ready for the Full System — here's the gig link"
- "You need X first — here's what I offer for that"
- "You're earlier than any of my gigs right now — start here (Income School link)"

**Where it lives:** Embedded on Content Forge page + linked from Fiverr bio.
**Stack:** React or simple HTML form → Claude API → conditional routing display.
**Time to build:** 4-6 hours including Claude prompt engineering.

---

## THE EMAIL TO SMITH1241512 (ready to send)

Hey — thanks for reaching out. Your inquiry actually helped me spot a blind spot in my offer copy, so I appreciate that.

I'm refining things right now based on real friction I've hit with customers — trying to be clearer upfront about what you need to have in place before we start, so if we work together it's actually a fit and not a frustration.

Give me 48 to 72 hours and I'll send you something way more useful than what's up there now.

---

## BUILD PRIORITY ORDER

1. Send smith1241512 email — 2 minutes, already written
2. GIG D: YouTube to Curriculum — lowest hands-on, Content Quarry already does it, publish today
3. Content Forge filter page — one HTML page, 2-3 hours
4. Discovery questionnaire — Claude-connected intake, 4-6 hours
5. Gig A: Niche + Pillar Plan — lowest complexity, high demand
6. Gig B: Editorial Calendar — fast to deliver, easy to template
7. Gig C: Research Pipeline — slightly more custom but repeatable
8. Publish Fiverr Gig 2 and Gig 3 — already written, just need publish

---

## THE ONE-SENTENCE POSITIONING

"I'm not the starting point — I'm what you hire once you've got your foundation. If you don't have it yet, here's where to get it free."

---

## SHIP CHECK
The Stone Bird — KDP package complete, cover brief done, educator guide written.
Single next step: upload manuscript at kdp.amazon.com and hit publish.
This is 45 minutes of work. It has been waiting too long.

---
Document generated by Pinholi/Claude — June 14, 2026
Update CATALOG.md when Content Forge page and GIG D are live
