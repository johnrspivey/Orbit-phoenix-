#!/usr/bin/env python3
"""
Bitwerx API Cost Dashboard
Pulls Anthropic org usage data, maps API keys to product names,
and flags any model ID outside the approved list (catches deprecated-model
auto-routing like the Content Quarry claude-opus-4-5 -> claude-fable-5 incident).

Setup:
  1. Create an Admin API key at platform.claude.com -> Settings -> Admin Keys
  2. export ANTHROPIC_ADMIN_KEY="sk-ant-admin-..."
  3. Fill in KEY_NAME_MAP below with your actual api_key_id -> product name pairs
     (find api_key_id values in platform.claude.com -> API Keys, or from the
     first raw pull -- run once, check /raw, copy the IDs you see)
  4. pip install flask requests --break-system-packages
  5. pm2 start cost_dashboard.py --name cost-dashboard --interpreter python3
"""
import os
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

ADMIN_KEY = os.environ.get("ANTHROPIC_ADMIN_KEY")
BASE_URL = "https://api.anthropic.com/v1/organizations"

# Map API key IDs to product names. Leave empty and check /raw first
# to find the real api_key_id values, then fill this in.
KEY_NAME_MAP = {
    # "apikey_xxxxxxxxxxxx": "Content Quarry",
    # "apikey_xxxxxxxxxxxx": "Skipper",
    # "apikey_xxxxxxxxxxxx": "Gig Pig",
}

# Anything NOT in this set gets flagged in red on the dashboard.
# Update this list when you intentionally start using a new model.
APPROVED_MODELS = {
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-opus-4-8",
}

# Rough per-million-token pricing (input, output) in USD.
# Update if Anthropic changes pricing -- this is only an estimate,
# not a substitute for the real Cost page.
PRICING = {
    "claude-sonnet-4-6": (3, 15),
    "claude-haiku-4-5-20251001": (1, 5),
    "claude-opus-4-8": (5, 25),
    "claude-fable-5": (10, 50),
    "claude-mythos-5": (10, 50),
}


def fetch_usage(days=30):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    headers = {
        "x-api-key": ADMIN_KEY,
        "anthropic-version": "2023-06-01",
    }
    params = [
        ("starting_at", start.strftime("%Y-%m-%dT00:00:00Z")),
        ("ending_at", end.strftime("%Y-%m-%dT00:00:00Z")),
        ("bucket_width", "1d"),
        ("group_by[]", "api_key_id"),
        ("group_by[]", "model"),
    ]
    resp = requests.get(f"{BASE_URL}/usage_report/messages", headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def summarize(data):
    """Aggregate tokens/cost per key+model, flag unapproved models.
    NOTE: field names (api_key_id, model, input_tokens, output_tokens) are
    based on Anthropic's documented schema as of this writing. If /raw shows
    different field names, adjust the .get() calls below to match.
    """
    rows = {}
    for bucket in data.get("data", []):
        for entry in bucket.get("results", []):
            key_id = entry.get("api_key_id", "unknown")
            model = entry.get("model", "unknown")
            tokens_in = entry.get("uncached_input_tokens", entry.get("input_tokens", 0)) or 0
            tokens_out = entry.get("output_tokens", 0) or 0
            rk = (key_id, model)
            if rk not in rows:
                rows[rk] = {"tokens_in": 0, "tokens_out": 0}
            rows[rk]["tokens_in"] += tokens_in
            rows[rk]["tokens_out"] += tokens_out

    results = []
    for (key_id, model), t in rows.items():
        price_in, price_out = PRICING.get(model, (0, 0))
        cost = (t["tokens_in"] / 1_000_000 * price_in) + (t["tokens_out"] / 1_000_000 * price_out)
        results.append({
            "key_id": key_id,
            "product": KEY_NAME_MAP.get(key_id, key_id),
            "model": model,
            "flagged": model not in APPROVED_MODELS,
            "tokens_in": t["tokens_in"],
            "tokens_out": t["tokens_out"],
            "est_cost": round(cost, 2),
        })
    return sorted(results, key=lambda r: -r["est_cost"])


TEMPLATE = """
<!doctype html>
<html><head><title>Bitwerx API Cost Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:-apple-system,sans-serif;background:#111;color:#eee;padding:16px;margin:0}
h1{font-size:1.3em}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:0.85em}
th,td{padding:8px 6px;border-bottom:1px solid #333;text-align:left}
.flag{color:#ff5f5f;font-weight:bold}
.warn{background:#2a1414}
.total{font-weight:bold;border-top:2px solid #666}
</style></head><body>
<h1>Bitwerx API Cost Dashboard</h1>
<p>Last 30 days, estimated cost (not exact billing) &middot; unmapped key_ids show raw ID -- fill in KEY_NAME_MAP</p>
<table>
<tr><th>Product</th><th>Model</th><th>Tokens In</th><th>Tokens Out</th><th>Est. Cost</th></tr>
{% for r in rows %}
<tr class="{{ 'warn' if r.flagged else '' }}">
<td>{{ r.product }}</td>
<td class="{{ 'flag' if r.flagged else '' }}">{{ r.model }}{% if r.flagged %} ⚠{% endif %}</td>
<td>{{ '{:,}'.format(r.tokens_in) }}</td>
<td>{{ '{:,}'.format(r.tokens_out) }}</td>
<td>${{ r.est_cost }}</td>
</tr>
{% endfor %}
<tr class="total"><td colspan="4">Total (estimated)</td><td>${{ '%.2f'|format(rows|sum(attribute='est_cost')) }}</td></tr>
</table>
</body></html>
"""


@app.route("/")
def dashboard():
    if not ADMIN_KEY:
        return "ANTHROPIC_ADMIN_KEY not set in environment.", 500
    data = fetch_usage()
    rows = summarize(data)
    return render_template_string(TEMPLATE, rows=rows)


@app.route("/raw")
def raw():
    """Hit this first to see real field names and api_key_id values
    before trusting the parsed dashboard above."""
    if not ADMIN_KEY:
        return jsonify({"error": "ANTHROPIC_ADMIN_KEY not set"}), 500
    return jsonify(fetch_usage())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003)
