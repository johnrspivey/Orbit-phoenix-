# Friction Log — Impediments & Remedies

Running list of things that trip up operations, their fixes, and where no clean fix exists yet — those get handed to Skipper when viable. No impediment exists unchallenged.

---

## Resolved / Known Remedy

### Droplet locked out — password auth disabled by cloud-init
**Symptom:** Every password rejected over SSH and console despite successful resets. Loops back to login.
**Cause:** Ubuntu 24.04 ships with `/etc/ssh/sshd_config.d/60-cloudimg-settings.conf` setting `PasswordAuthentication no`, which overrides the `50-cloud-init.conf` `yes`. Higher number wins.
**Remedy:** Don't fight passwords. Use SSH keys. Boot Recovery ISO → mount disk → import key via `ssh-import-id` from the rescue shell (NOT chroot — chroot has no DNS).
**Permanent prevention:** Set up SSH keys correctly at droplet creation. Keep public key on GitHub for instant `ssh-import-id gh:johnrspivey`.

### chroot has no internet / DNS
**Symptom:** `ssh-import-id` fails inside chroot with "Temporary failure in name resolution."
**Cause:** DNS config doesn't carry into the chroot environment.
**Remedy:** Run network commands (like ssh-import-id) in the rescue shell BEFORE chrooting, then copy results onto the mounted disk at /mnt.

### SSH key rejected despite correct key
**Symptom:** Mac offers correct key (fingerprint matches), server rejects, falls back to password.
**Cause:** Permissions or ownership on /root or /root/.ssh wrong. SSH silently refuses keys if home dir or .ssh has loose/wrong ownership.
**Remedy:** chmod 700 /root/.ssh, chmod 600 authorized_keys, AND verify /root is owned by root:root and not group/world writable. (Under investigation as of June 2026 — full root cause being confirmed.)

---

## No Clean Remedy Yet — HAND TO SKIPPER

### DigitalOcean Recovery Console mangles paste / inverts characters
**Symptom:** Pasted text gets corrupted — numbers become symbols, case flips, special chars garble. Destroyed an SSH key paste and a command (`ssh-import-id` became `SSH-IMPORT-ID`).
**Cause:** DigitalOcean's browser-based recovery console has poor/no clipboard support and a keyboard mapping bug.
**Current workaround:** Avoid typing/pasting anything complex into the console. Pull data from external sources (GitHub via ssh-import-id) so nothing needs to be typed. Use lowercase-only, simple commands.
**Skipper target:** A bootstrap/automation path that doesn't depend on the broken console at all — e.g. a deploy webhook or out-of-band admin channel (ref SKIPPER_ROADMAP.md Layer 1 & 3). Skipper should own droplet recovery so a human never has to fight that console again.

### No single source of truth for infrastructure access
**Symptom:** John can't independently recall droplet IP, usernames, console paths, recovery procedure — fully dependent on assistant mid-crisis.
**Remedy in progress:** Create INFRASTRUCTURE_ACCESS.md — IP, usernames, key locations, console URLs, step-by-step recovery runbook. Not passwords, but everything around them.
**Skipper target:** Skipper maintains and surfaces this on request. "How do I get into the droplet" should be a question Skipper answers instantly.

### Manual multi-step recovery is slow and error-prone
**Symptom:** Today's lockout took hours of back-and-forth, one step at a time.
**Skipper target:** A documented, scripted recovery runbook Skipper can either walk through or execute. Turn a 2-hour ordeal into a 5-minute known procedure.

---

## Status
Living document. Add every new impediment as it appears. Started June 2026.
