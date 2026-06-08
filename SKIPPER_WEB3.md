# Skipper Web3 Integration — Concept Stub

## Why Web3
Not decentralization for its own sake. Specific seams where blockchain architecture adds real value to Skipper as a product.

---

## High-Value Applications

### 1. Wallet-Signed Command Layer
Only the keyholder can issue certain Skipper commands — cryptographically verified, no password to steal or lose. Not just security, it's a feature. "Only you can command your AI infrastructure" is a product statement.

- Wallet signs the request
- Skipper verifies the signature before executing
- No signature, no execution — regardless of how the request arrived

### 2. Decentralized Config / Tool Definitions
Store Skipper's tool registry or core config on IPFS or Arweave. If the droplet goes down, the definitions survive. Any new instance of Skipper can bootstrap from the decentralized store.

- Addresses the "source only lives on the droplet" problem from a different angle
- Immutable versioning — you can always roll back to a known-good config

### 3. Tamper-Proof Audit Log
Every command Skipper executes written on-chain. Immutable, timestamped, attributable. Useful if Skipper ever becomes a multi-user or enterprise product — full accountability trail nobody can alter after the fact.

---

## What Web3 Does NOT Solve
- Execution still requires a server — blockchain can't make API calls
- github_write, pm2_restart, Twilio — all centralized regardless
- Adds complexity cost that isn't worth it at solo/MVP stage

---

## Phasing
- **Now:** GitHub source + SHA fix (SKIPPER_ROADMAP.md) — 90% of robustness needed
- **Later:** Wallet-signed commands when Skipper becomes a product or multi-user
- **Much later:** On-chain audit log, decentralized config

---

## Relevance to Other Products
- Sentinel Drone — wallet-signed dispatch commands, on-chain patrol logs
- Any Bitwerx product that handles sensitive operator actions

---

## Status
Concept. No code. Idea captured June 2026.
