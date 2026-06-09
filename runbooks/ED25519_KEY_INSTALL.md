# Runbook — Install ed25519 SSH Key on Droplet (Permanent Fix)

## Why This Exists
The Mac runs OpenSSH 8.1 (old). The droplet runs OpenSSH 9.6 (new). New servers reject old RSA/SHA-1 key signatures by default. The RSA key is valid but the signature negotiation fails, so the server silently refuses it and falls back to password — which is disabled. Total lockout despite everything looking correct.

**ed25519 keys sidestep this entirely.** Modern key type, works cleanly between old client and new server, no algorithm drama. This is the permanent fix.

---

## Part 1 — Generate the new key (Mac Terminal, ~1 min)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
```

- `-t ed25519` = modern key type
- `-N ""` = no passphrase (simple; add one later if desired)
- Creates `~/.ssh/id_ed25519` (private) and `~/.ssh/id_ed25519.pub` (public)

Then copy the public key to clipboard:
```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

Verify it's on the clipboard:
```bash
pbpaste
```
Should print one line starting `ssh-ed25519` ending `user@Users-Computer.local`.

---

## Part 2 — Add key to GitHub (browser, ~1 min)

1. github.com/settings/keys → New SSH key
2. Title: TYPE (don't copy) something like `MacBook-ed25519`
3. Key field: Cmd+V
4. Add SSH key

(GitHub is the paste-proof relay — avoids the mangling recovery console entirely.)

---

## Part 3 — Boot into recovery (DigitalOcean, ~3 min)

1. Droplet → Settings → Recovery mode → Edit → **Boot from Recovery ISO** → Save
2. Power: Turn Off → wait → Power On
3. Launch Recovery Console
4. `1` (mount disk) → `6` (interactive shell)

DO NOT chroot yet — the rescue shell has internet, chroot does not.

---

## Part 4 — Pull key in rescue shell, copy to disk

In the `[* Rescue *]` shell (has internet):
```bash
ssh-import-id gh:johnrspivey
```
This downloads ALL your GitHub keys into the rescue env's /root/.ssh/authorized_keys.

Copy onto the real mounted disk:
```bash
cat /root/.ssh/authorized_keys > /mnt/root/.ssh/authorized_keys
chmod 700 /mnt/root/.ssh
chmod 600 /mnt/root/.ssh/authorized_keys
```
(Using `>` not `>>` to overwrite — clean file, no old duplicates.)

Verify:
```bash
cat /mnt/root/.ssh/authorized_keys
```
Should show your ed25519 key (and the old RSA, harmless).

---

## Part 5 — Boot back to normal

1. `exit` (back to menu)
2. DigitalOcean → Settings → Recovery mode → **Boot from Hard Drive** → Save
3. Power: Turn Off → wait → Power On

---

## Part 6 — Test (Mac Terminal)

```bash
ssh root@167.99.7.190
```

Should log straight in, no password. SSH auto-tries id_ed25519. If it doesn't, force it:
```bash
ssh -i ~/.ssh/id_ed25519 root@167.99.7.190
```

---

## Part 7 — Once In: Make Life Permanent

Add to `~/.ssh/config` on the Mac so you never type flags again:
```
Host bitwerx
    HostName 167.99.7.190
    User root
    IdentityFile ~/.ssh/id_ed25519
```
Then login is just: `ssh bitwerx`

And on the droplet, verify PM2 services survived all the reboots:
```bash
pm2 status
```
If anything is down: `pm2 resurrect` or restart individually.

---

## Status
Runbook ready June 2026. If ed25519 also fails at Part 6, the issue is server-side AllowUsers/Match blocks or a non-standard root home — pull /var/log/auth.log via recovery to see the exact rejection reason.
