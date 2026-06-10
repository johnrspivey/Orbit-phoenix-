-- PERISCOPE — Supabase setup
-- Run this once in the Supabase SQL Editor

create table if not exists periscope_crawls (
  id bigint generated always as identity primary key,
  domain text not null,
  url text not null,
  crawled_at timestamptz not null default now(),
  status int,
  nav jsonb,
  signals jsonb,
  changed boolean default false,
  error text
);

create index if not exists idx_periscope_domain_time
  on periscope_crawls (domain, crawled_at desc);

-- Latest crawl per domain (used by GET /domains)
create or replace view periscope_latest as
select distinct on (domain)
  domain, crawled_at, status, changed, error,
  signals->>'title' as title,
  signals->'stack' as stack,
  (signals->>'has_pricing_page')::boolean as has_pricing_page
from periscope_crawls
order by domain, crawled_at desc;

-- Lock it down: service key bypasses RLS, so just enable RLS
-- with no public policies. Only the server can read/write.
alter table periscope_crawls enable row level security;
