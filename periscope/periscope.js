// ============================================================
// PERISCOPE v1.0 — Bitwerx Labs
// Nav-structure crawler + signals collector + API
//
// Usage:
//   node periscope.js          -> serve API + internal weekly crawl
//   node periscope.js crawl    -> run one crawl pass and exit
//
// Env vars required (.env or PM2 ecosystem):
//   SUPABASE_URL          your Supabase project URL
//   SUPABASE_SERVICE_KEY  service role key (server-side only)
//   PORT                  optional, default 4600
//
// Dependencies:  npm install cheerio @supabase/supabase-js express dotenv
// Node 18+ (native fetch)
// ============================================================

require('dotenv').config();
const cheerio = require('cheerio');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// ---------- CONFIG ----------

const SEEDS = [
  // Bitwerx portfolio
  'https://therulingclassreport.com',
  'https://bitwerxlabs.com',
  'https://nomadsleep.netlify.app',
  'https://gigpig.online',
  'https://contentquarry.gigpig.online',
  'https://850420.com',
  'https://dopesonic.pro',
  // Dashboards / SaaS we live in
  'https://stripe.com',
  'https://www.netlify.com',
  'https://supabase.com',
  'https://github.com',
  'https://www.namecheap.com',
  'https://www.cloudflare.com',
];

const CRAWL_INTERVAL_DAYS = 7;     // weekly
const CHECK_EVERY_HOURS = 12;      // how often the scheduler checks staleness
const FETCH_TIMEOUT_MS = 15000;
const UA = 'PeriscopeBot/1.0 (+https://bitwerxlabs.com; nav-structure research)';
const PORT = process.env.PORT || 4600;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ---------- FETCH HELPERS ----------

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      signal: ctrl.signal,
      ...opts,
    });
  } finally {
    clearTimeout(t);
  }
}

async function exists(url) {
  try {
    let res = await fetchWithTimeout(url, { method: 'HEAD' });
    if (res.status === 405) res = await fetchWithTimeout(url); // some hosts hate HEAD
    return res.ok;
  } catch {
    return false;
  }
}

function domainOf(url) {
  return new URL(url).hostname.replace(/^www\./, '');
}

function absolutize(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

// ---------- NAV EXTRACTION ----------

function extractLinks($, scope, base) {
  const links = [];
  $(scope).find('a[href]').each((_, el) => {
    const $el = $(el);
    const href = ($el.attr('href') || '').trim();
    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    const abs = absolutize(href, base);
    if (!abs) return;
    links.push({ text: text.slice(0, 80), href: abs });
  });
  // de-dupe by href+text
  const seen = new Set();
  return links.filter(l => {
    const k = l.href + '|' + l.text;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function extractNav($, base) {
  const nav = { header: [], navs: [], footer: [] };

  $('nav').each((i, el) => {
    const label =
      $(el).attr('aria-label') ||
      $(el).attr('id') ||
      $(el).attr('class')?.split(/\s+/)[0] ||
      `nav-${i + 1}`;
    const links = extractLinks($, el, base);
    if (links.length) nav.navs.push({ label: String(label).slice(0, 60), links });
  });

  // header links not already inside a <nav>
  const headerLinks = extractLinks($, 'header', base);
  const inNavs = new Set(nav.navs.flatMap(n => n.links.map(l => l.href + '|' + l.text)));
  nav.header = headerLinks.filter(l => !inNavs.has(l.href + '|' + l.text));

  nav.footer = extractLinks($, 'footer', base);
  return nav;
}

// ---------- SIGNALS EXTRACTION ----------

const SOCIAL_HOSTS = [
  'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com',
  'youtube.com', 'tiktok.com', 'github.com', 'discord.gg', 'discord.com',
  'threads.net', 'pinterest.com', 'reddit.com',
];

function detectStack($, html) {
  const stack = [];
  const gen = $('meta[name="generator"]').attr('content');
  if (gen) stack.push(`generator:${gen.slice(0, 60)}`);
  const checks = [
    [/__NEXT_DATA__|\/_next\//, 'nextjs'],
    [/data-reactroot|react(-dom)?(\.production)?(\.min)?\.js|__REACT/i, 'react'],
    [/wp-content|wp-includes/, 'wordpress'],
    [/cdn\.shopify\.com/, 'shopify'],
    [/website-files\.com|webflow/, 'webflow'],
    [/__NUXT__/, 'nuxt'],
    [/data-v-app|vue(\.runtime)?(\.global)?(\.min)?\.js/i, 'vue'],
    [/_astro\//, 'astro'],
    [/static\.squarespace\.com/, 'squarespace'],
    [/wixstatic\.com|wix\.com/, 'wix'],
    [/gatsby/, 'gatsby'],
    [/netlify/i, 'netlify-hosted?'],
  ];
  for (const [re, name] of checks) if (re.test(html)) stack.push(name);
  return [...new Set(stack)];
}

function detectAnalytics(html) {
  const found = [];
  const ga = html.match(/G-[A-Z0-9]{6,12}/);
  if (ga) found.push(`ga4:${ga[0]}`);
  const ua = html.match(/UA-\d{4,10}-\d{1,4}/);
  if (ua) found.push(`ua:${ua[0]}`);
  if (/fbq\(/.test(html)) found.push('meta-pixel');
  if (/plausible\.io/.test(html)) found.push('plausible');
  if (/static\.hotjar\.com/.test(html)) found.push('hotjar');
  if (/clarity\.ms/.test(html)) found.push('ms-clarity');
  return found;
}

function extractSignals($, html, base, allLinks) {
  const signals = {};

  signals.title = ($('title').first().text() || '').trim().slice(0, 200);
  signals.description = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 300);
  signals.og_image = $('meta[property="og:image"]').attr('content') || null;
  signals.has_schema_org = $('script[type="application/ld+json"]').length > 0;

  signals.stack = detectStack($, html);
  signals.analytics = detectAnalytics(html);

  signals.social = allLinks
    .map(l => l.href)
    .filter(h => SOCIAL_HOSTS.some(s => h.includes(s)))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 15);

  signals.emails = [...new Set(
    (html.match(/mailto:([^"'\s?]+)/g) || []).map(m => m.replace('mailto:', ''))
  )].slice(0, 5);

  const yearMatches = html.match(/(?:©|&copy;|copyright)\s*(\d{4})/i);
  signals.copyright_year = yearMatches ? parseInt(yearMatches[1], 10) : null;

  signals.rss = $('link[type="application/rss+xml"], link[type="application/atom+xml"]')
    .map((_, el) => absolutize($(el).attr('href'), base)).get().slice(0, 3);

  signals.pricing_link = allLinks.find(l =>
    /pricing|plans/i.test(l.href) || /^pricing$|^plans$/i.test(l.text)
  )?.href || null;

  return signals;
}

// ---------- CRAWL ONE DOMAIN ----------

async function crawlSite(url) {
  const domain = domainOf(url);
  const record = {
    domain,
    url,
    crawled_at: new Date().toISOString(),
    status: null,
    nav: null,
    signals: null,
    changed: false,
    error: null,
  };

  try {
    const res = await fetchWithTimeout(url);
    record.status = res.status;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const nav = extractNav($, url);
    const allLinks = [
      ...nav.header,
      ...nav.footer,
      ...nav.navs.flatMap(n => n.links),
    ];
    const signals = extractSignals($, html, url, allLinks);

    // cheap extra checks (parallel)
    const origin = new URL(url).origin;
    const [sitemap, robots, pricingPage] = await Promise.all([
      exists(origin + '/sitemap.xml'),
      exists(origin + '/robots.txt'),
      signals.pricing_link ? Promise.resolve(true) : exists(origin + '/pricing'),
    ]);
    signals.has_sitemap = sitemap;
    signals.has_robots = robots;
    signals.has_pricing_page = !!(signals.pricing_link || pricingPage);

    record.nav = nav;
    record.signals = signals;

    // diff vs last crawl
    const { data: prev } = await supabase
      .from('periscope_crawls')
      .select('nav')
      .eq('domain', domain)
      .order('crawled_at', { ascending: false })
      .limit(1);
    if (prev && prev.length) {
      record.changed = JSON.stringify(prev[0].nav) !== JSON.stringify(nav);
    } else {
      record.changed = true; // first sighting
    }
  } catch (err) {
    record.error = String(err.message || err).slice(0, 200);
  }

  const { error: dbErr } = await supabase.from('periscope_crawls').insert(record);
  if (dbErr) console.error(`[db] ${domain}: ${dbErr.message}`);

  const tag = record.error ? `ERROR ${record.error}` : record.changed ? 'CHANGED' : 'ok';
  console.log(`[crawl] ${domain} — ${tag}`);
  return record;
}

async function crawlAll() {
  console.log(`[periscope] crawl pass starting — ${SEEDS.length} domains`);
  for (const url of SEEDS) {
    await crawlSite(url);
    await new Promise(r => setTimeout(r, 2000)); // be polite
  }
  console.log('[periscope] crawl pass complete');
}

// ---------- SCHEDULER ----------

async function lastCrawlTime() {
  const { data } = await supabase
    .from('periscope_crawls')
    .select('crawled_at')
    .order('crawled_at', { ascending: false })
    .limit(1);
  return data && data.length ? new Date(data[0].crawled_at) : null;
}

async function maybeCrawl() {
  const last = await lastCrawlTime();
  const staleMs = CRAWL_INTERVAL_DAYS * 24 * 3600 * 1000;
  if (!last || Date.now() - last.getTime() > staleMs) {
    await crawlAll();
  } else {
    const next = new Date(last.getTime() + staleMs);
    console.log(`[periscope] fresh — next crawl after ${next.toISOString()}`);
  }
}

// ---------- API ----------

function startServer() {
  const app = express();

  app.get('/health', (_, res) =>
    res.json({ ok: true, service: 'periscope', time: new Date().toISOString() })
  );

  // latest nav for a domain
  app.get('/nav/:domain', async (req, res) => {
    const { data, error } = await supabase
      .from('periscope_crawls')
      .select('domain,crawled_at,status,nav,changed')
      .eq('domain', req.params.domain)
      .order('crawled_at', { ascending: false })
      .limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: 'domain not crawled' });
    res.json(data[0]);
  });

  // latest signals for a domain
  app.get('/signals/:domain', async (req, res) => {
    const { data, error } = await supabase
      .from('periscope_crawls')
      .select('domain,crawled_at,status,signals')
      .eq('domain', req.params.domain)
      .order('crawled_at', { ascending: false })
      .limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: 'domain not crawled' });
    res.json(data[0]);
  });

  // all domains, latest status + changed flag
  app.get('/domains', async (_, res) => {
    const { data, error } = await supabase
      .from('periscope_latest')
      .select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // change history for a domain
  app.get('/history/:domain', async (req, res) => {
    const { data, error } = await supabase
      .from('periscope_crawls')
      .select('crawled_at,status,changed,error')
      .eq('domain', req.params.domain)
      .order('crawled_at', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // trigger a crawl manually:  POST /crawl
  app.post('/crawl', async (_, res) => {
    res.json({ started: true });
    crawlAll().catch(e => console.error('[crawl] failed:', e));
  });

  app.listen(PORT, () =>
    console.log(`[periscope] API listening on :${PORT}`)
  );
}

// ---------- MAIN ----------

const mode = process.argv[2] || 'serve';

if (mode === 'crawl') {
  crawlAll().then(() => process.exit(0));
} else {
  startServer();
  maybeCrawl();
  setInterval(maybeCrawl, CHECK_EVERY_HOURS * 3600 * 1000);
}
