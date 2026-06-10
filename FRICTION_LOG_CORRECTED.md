# Friction Log — CORRECTED ROOT CAUSE (June 2026 lockout)

## ★ THE ACTUAL ROOT CAUSE — root's login shell was missing

**What it really was:** root's login shell in /etc/passwd was set to `/bin/zsh`, but zsh was never installed on the droplet. With no valid shell, the system could not start a session for root, so EVERY login failed — key or password, SSH or web console — and the auth log recorded `User root not allowed`.

**The tell, available from the FIRST failed attempt:** /var/log/auth.log contained `User root not allowed`. We did not read it until ~4 hours in.

**The fix (one line, from recovery, editing the mounted disk):**
```
sed -i 's|/bin/zsh|/bin/bash|' /mnt/etc/passwd
```
Then verify: `grep "^root" /mnt/etc/passwd` should end in `/bin/bash`.

**How it probably happened:** something set root's shell to zsh (possibly a copied-in dotfile/setup step, or the same "default shell is now zsh" macOS prompt logic applied server-side by mistake) without installing zsh.

---

## THEORIES WE CHASED THAT WERE WRONG (so we don't repeat them)
- Password auth disabled by cloud-init — real config quirk, but NOT why we were locked out
- File permissions/ownership on /root/.ssh — verified correct, not the cause
- OpenSSH 8.1 (Mac) vs 9.6 (server) RSA/SHA-1 mismatch — plausible, but the ed25519 key ALSO failed, which should have told us immediately the key type wasn't the issue
- AllowUsers/PermitRootLogin override — checked, none existed

**Meta-lesson (the important one):** When a key is OFFERED and rejected, READ /var/log/auth.log FIRST. The server states the reason in plain text. Do not theorize before reading the diagnostic. This single habit would have turned a 4-hour ordeal into 5 minutes.

---

## STILL VALID REMEDIES FROM THIS INCIDENT
- chroot has no DNS — run network commands (ssh-import-id) in the rescue shell, then copy to /mnt
- DigitalOcean recovery console mangles paste (numbers/case) — pull keys from GitHub via ssh-import-id so nothing is typed
- Use ed25519 keys going forward (still good practice regardless)
- ~/.ssh/config Host shortcut set up: `ssh bitwerx` now logs in directly

---

## HAND TO SKIPPER
- **Log Monitor** (see projects/log-monitor) — an active watcher that would have surfaced "User root not allowed" immediately. Highest-value takeaway from this incident.
- Fix the github_read SHA bug (blocked overwriting earlier friction log versions — note there are now v1, v2, and this correction; merge when SHA fixed)
- INFRASTRUCTURE_ACCESS.md so John isn't dependent on the assistant mid-crisis
- Scripted recovery runbook

## Status
Corrected June 2026 after the real cause was found. Supersedes the OpenSSH-version theory in earlier versions.
