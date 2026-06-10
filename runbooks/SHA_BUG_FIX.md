# Skipper SHA Bug — EXACT FIX (ready to apply)

## Confirmed June 2026 — root cause located

**File:** /var/www/skipper/server.js
**Function:** github_read (line 43-46)
**Bug:** Line 44 returns the file content but discards `r.data.sha`, which GitHub includes in the same API response. Without the SHA, github_write can't overwrite existing files (GitHub 409 error).

## The current broken line 44
```js
    try{const r=await axios.get("https://api.github.com/repos/"+owner+"/"+repo+"/contents/"+path,{headers:{Authorization:"token "+GITHUB_TOKEN,Accept:"application/vnd.github.v3+json"}});return{content:[{type:"text",text:Buffer.from(r.data.content,"base64").toString("utf8")}]};}
```

The data we need is already fetched — `r.data.sha` exists in that response, just unused.

## The fix — return the SHA alongside content
Replace the return so the SHA rides at the top of the output:
```js
return{content:[{type:"text",text:"SHA: "+r.data.sha+"\n\n"+Buffer.from(r.data.content,"base64").toString("utf8")}]};
```

## How to apply (next session, ~3 min)
1. `ssh bitwerx`
2. `cp /var/www/skipper/server.js /var/www/skipper/server.js.bak`  (backup first!)
3. Edit /var/www/skipper/server.js line 44 — swap the return statement as above (use nano, or a sed replace)
4. `pm2 restart skipper`
5. `pm2 status` — confirm skipper online, no restart loop
6. Test: github_read any existing file → confirm SHA appears at top → github_write with that SHA → confirm overwrite succeeds

## Optional robustness upgrade (later)
Make github_write auto-fetch the SHA when none is provided and the file exists (read-before-write fallback). Then callers never have to think about SHAs at all. Bigger change — do after the simple fix is verified working.

## Note
github_write (line 47-48) is already correct — it handles `if(sha)` properly. The ONLY problem was github_read not surfacing the SHA. One-line fix.

## Status
Diagnosed and fix written June 2026. Not yet applied. Apply next session with MacBook or phone — it's small enough for either now that access works.
