# Skipper — Progressive Personalization & AI Helpdesk

## Feature 1: Progressive Personalization (Onboarding Through Conversation)

### The Problem It Solves
New users won't know how to build their context layer. A blank template is intimidating. A form feels like homework. Neither works for less technical buyers.

### The Solution
Skipper asks one getting-to-know-you question at the start of each session until the core context is solid. Conversational, not clinical. The user never feels like they're filling out a form — they're just talking to Skipper.

### User Controls
- **On** — Skipper asks one question per session opener
- **Off** — user disables it anytime, no questions asked
- **Done** — Skipper self-reports when context is sufficient: "I think I know enough to work well for you now. You can turn check-ins off anytime."

### Question Sequence
Follows a deliberate progression — not random:

**Stage 1 — Infrastructure**
- What tools and platforms do you use daily?
- Where does your code live?
- What's your deployment setup?
- What services are you paying for right now?

**Stage 2 — Workflow**
- How do you typically start a work session?
- What does a productive day look like for you?
- What slows you down most?
- How do you capture ideas?

**Stage 3 — Projects**
- What are you actively building right now?
- What's closest to generating revenue?
- What's on the back burner?
- What have you abandoned and why?

**Stage 4 — Decision Patterns**
- How do you decide what to work on next?
- What makes you say yes to a new idea?
- What makes you say no?
- Who do you build for?

**Stage 5 — Voice & Preferences**
- How do you like information delivered?
- What communication style works best for you?
- What annoys you in a tool or assistant?
- What does good help feel like to you?

### Why This Works
- Retention mechanic — more sessions = more context = more value = higher switching cost
- Accessible to non-technical buyers — no setup required, Skipper does the work
- Progressive — never overwhelming, always one question
- Self-terminating — Skipper knows when to stop

This is called **progressive personalization** and most tools do it poorly or not at all.

---

## Feature 2: AI-Powered Helpdesk

### The Concept
A Skipper helpdesk staffed entirely by AI. No human support agents. Available 24/7. Knows the product completely. Gets better over time.

### How Hard Is It?
Not hard at all with current tools. Here's the honest breakdown:

**What makes it easy:**
- Claude API handles the conversation layer natively
- A knowledge base (docs, FAQs, troubleshooting guides) fed as context is all it needs to start
- Escalation path (email or ticket to John) handles anything it can't resolve
- No infrastructure beyond a Netlify function and a simple UI

**What makes it good vs just functional:**
- A well-written system prompt that defines Skipper's helpdesk persona
- Structured knowledge base — not a wall of text but organized by topic
- Feedback loop — unresolved questions get flagged and added to the KB over time
- The progressive personalization data helps — Skipper already knows the user's setup

**Stack:**
- Claude API (conversation)
- Supabase (knowledge base storage, ticket log)
- Netlify serverless function (API proxy)
- Simple chat UI on the product site

### The Business Value
- Zero support labor cost
- Available when John is driving, sleeping, or diving
- Scales to any number of users without hiring
- Every unresolved ticket is a product improvement signal

### Escalation Path
AI handles 80-90% of issues. Anything it can't resolve generates a simple email or Supabase ticket to John. User gets told: "I've flagged this for a human review — you'll hear back within 24 hours."

### Persona
The helpdesk AI should feel like Skipper helping a new user learn Skipper. Same voice. Same directness. No corporate support-speak.

---

## Status
Both features captured June 2026. No code yet. High priority for Skipper commercial version.
