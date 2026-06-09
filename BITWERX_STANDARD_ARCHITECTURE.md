# Bitwerx Labs — Standard Product Architecture

## Core Principle
Every Bitwerx product ships with the same foundational layer. Build it once, deploy everywhere. No product launches without these components in place or on the immediate roadmap.

---

## Standard Components

### 1. AI Helpdesk
Every product gets an AI-powered support layer. Not optional. Not a later phase. A standard part of what it means to be a Bitwerx product.

**Why:** Zero support labor. 24/7 availability. Scales without hiring. Every unresolved ticket is a product improvement signal.

**Stack:** Claude API + Supabase knowledge base + Netlify serverless function + simple chat UI
**Escalation:** Anything unresolved generates a ticket to John. User is told to expect a response within 24 hours.
**Knowledge base:** Starts minimal, grows from real user questions over time.

Same architecture every time. Different knowledge base per product. Build the pattern once, drop it in everywhere.

### 2. Stripe Integration
Every product that charges money uses Stripe. The 2.5% fee on Gig Pig is sacred and product-specific — but Stripe is the universal payment layer across the portfolio.

### 3. Supabase
Auth, database, and storage. Standard backend for every product that needs persistence.

### 4. Netlify
Frontend deployment and serverless functions. Standard across the portfolio. Anthropic API proxied through Netlify functions — never exposed client-side.

### 5. Claude API
The AI layer. Proxied through Netlify. Never called directly from the frontend.

---

## The Pattern
Same engine. Different soul. Every product is a configuration of the same underlying stack — not a rebuild from scratch.

When a new product starts, the first question is not "what do I build" but "what does this product's version of the standard stack look like."

---

## Status
Living document. Updated as standards evolve. June 2026.
