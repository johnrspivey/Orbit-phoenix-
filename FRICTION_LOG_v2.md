# Friction Log v2 — Impediments & Remedies

(v2 because the SHA bug blocked overwriting v1 — see the irony. Merge when SHA is fixed.)

Running list of things that trip up operations, their fixes, and where no clean fix exists yet. No impediment exists unchallenged.

---

## Resolved / Known Remedy

### OLD Mac SSH client vs NEW server — RSA key silently rejected  ★ ROOT CAUSE OF JUNE 2026 LOCKOUT
**Symptom:** Mac offers correct RSA key (fingerprint matches authorized_keys), server rejects, falls back to password. Everything else verified correct — perms, ownership, config, key content — yet rejection persists.
**Cause:** Mac = OpenSSH 8.1. Droplet = OpenSSH 9.6. New servers reject RSA keys using deprecated SHA-1 signatures by default. OpenSSH 8.1 uses exactly that old scheme. Negotiation fails silently.
**Tell:** `ssh -v` shows `Local version string SSH-2.0-OpenSSH_8.1` vs remote `OpenSSH_9.6`. Key is OFFERED, then continues to password = algorithm rejection, not a key problem.
**Remedy:** Use a modern **ed25519** key. See runbooks/ED25519_KEY_INSTALL.md.
**Prevention:** ed25519 everywhere from now on. Consider `brew install openssh` to modernize the Mac client.

### Droplet locked out — password auth disabled by cloud-init
**Cause:** Ubuntu 24.04 `60-cloudimg-settings.conf` sets `PasswordAuthentication no`, overriding `50-cloud-init.conf`. Higher number wins.
**Remedy:** Use keys, not passwords. Recovery ISO → mount → `ssh-import-id` in rescue shell (not chroot).

### chroot has no internet / DNS
**Cause:** DNS doesn't carry into chroot.
**Remedy:** Run network commands in rescue shell BEFORE chrooting; copy results to /mnt.

### SSH key perms/ownership (checked, ruled out this time)
/root = 700 root:root, /root/.ssh = 700, authorized_keys = 600. SSH silently refuses loose perms.

---

## No Clean Remedy Yet — HAND TO SKIPPER

### DigitalOcean Recovery Console mangles paste / inverts characters
Numbers→symbols, case flips, special chars garble. Destroyed a key paste and a command this session.
**Workaround:** Pull from GitHub via ssh-import-id so nothing gets typed. Lowercase, simple commands only.
**Skipper target:** Own droplet recovery via out-of-band channel (webhook/admin process) so the broken console is never needed.

### No single source of truth for infrastructure access
John can't independently recall IP, usernames, console paths, recovery steps mid-crisis.
**In progress:** INFRASTRUCTURE_ACCESS.md.
**Skipper target:** Skipper answers "how do I get into the droplet" instantly.

### The SHA bug (META — it blocked THIS file's own update)
github_read doesn't return SHA → github_write can't overwrite existing files → 409. Forces v2/v3 filename workarounds.
**Skipper target:** Fix github_read to return SHA + add read-before-write fallback. THE highest-friction recurring bug. Ref SKIPPER_ROADMAP.md.

### Manual multi-step recovery slow + error-prone
June 2026 lockout = ~4 hours. Root cause (OpenSSH mismatch) found late because we chased password/perms/config theories first.
**Lesson:** Key OFFERED but rejected → check client-vs-server OpenSSH versions EARLY with `ssh -v`.
**Skipper target:** Scripted recovery runbook Skipper executes. 4 hours → 5 minutes.

---

## Status
Living document. Started June 2026. Merge v1 + v2 once SHA bug fixed.
