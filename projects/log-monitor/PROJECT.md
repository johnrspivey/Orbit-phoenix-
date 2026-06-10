# Log Monitor — Concept Stub

## Origin
Born June 2026 during a ~4-hour droplet lockout. The server wrote the exact cause (`User root not allowed`) to /var/log/auth.log from the first failed login. Hours were spent chasing theories — passwords, permissions, OpenSSH version mismatch — instead of reading what the server already said. The real cause: root's login shell was set to /bin/zsh, which wasn't installed, so no shell could start and every login failed. The log named it the whole time.

Lesson: the evidence is usually already there. Nobody's watching it when it matters.

## The Concept
A live log monitor that rides quietly in its own tab, tailing system logs (auth.log first, others later). When it detects a pattern matching a known failure — or matching whatever the operator is currently struggling with — it surfaces itself. Flashes. Speaks up.

Not a passive log viewer. An ACTIVE one that connects the symptom being chased to evidence already in the logs.

## Why It Fits Bitwerx
Same pattern as Sentinel drones and Groupie: raw signal in, plain-language tipoff out. The diagnostic version. An Observer for your own infrastructure.

## MVP
- Tails a log file (auth.log) in real time
- Pattern-matches against known failure signatures
- On match, the tab flashes/alerts
- Plain-language translation: "Server says: User root not allowed - check root's login shell exists. See FRICTION_LOG."

## Smarter Versions
- Cross-reference the friction log and surface the documented remedy automatically
- Multiple log sources (nginx, pm2, syslog, app logs)
- Skipper reads the monitor directly and names the cause BEFORE the operator types any diagnostic
- Severity tiers: quiet for bot-spam noise, loud for real problems
- "While you were chasing X, I saw Y forty times"

## The Bigger Idea
Skipper shouldn't make a human read logs. Monitor feeds Skipper, Skipper correlates against the friction log, operator just gets told the cause and the fix.

## Status
Concept. Captured June 2026 mid-incident. No code yet. Would have saved this entire afternoon.

## Related
- FRICTION_LOG (knowledge base for remedies)
- Sentinel Drone (same signal-to-tipoff pattern, physical domain)
- Skipper (eventual consumer of the output)
