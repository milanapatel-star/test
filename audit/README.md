# Mandir website audit

Answers one question from `docs/core-functions.md`: **are enough mandir events
published online, in a current and collectable form, to build Function 1 by
collection?** The pass mark is 70% of mandirs in the two clusters; below 40%
means pivot to the seva rota as the way listings get created.

## Status

- **List of 30 mandirs:** done (`mandirs.csv`) — 15 in north-west London
  (Brent, Harrow, Ealing) and 15 in Leicester.
- **Audit script:** done and tested (`audit.py`, `test_audit.py`).
- **Live run:** not done yet. The cloud environment this was built in blocks
  outbound access to the mandir sites. Run it on your own computer, or allow
  the hosts in the environment's network settings and re-run.
- **Websites:** only 11 of 30 have a known website. The other 19 need looking
  up by hand (search, Google Maps listing, Charity Commission register). Leave
  the cell empty if a mandir genuinely has no website — that is a result too.

## Run it

```sh
python3 audit/audit.py --start 2026-10-04 --days 30
```

Takes a few minutes: it waits 2 seconds between requests, identifies itself,
and obeys each site's robots.txt. Output goes to `audit/results/results.csv`
and `audit/results/summary.md`.

Tests (no network needed):

```sh
cd audit && python3 -m unittest test_audit -v
```

## What the categories mean

| Category | Meaning | Collectable? |
|---|---|---|
| A-current-structured | Dated events in the window, with an events plugin, schema.org data or an iCal feed | Yes, easily |
| B-current-in-page-text | Dated events in the window, written into ordinary page text | Yes, with LLM extraction |
| C-maybe-current-in-pdf-or-image | Events only as PDFs or posters | Possibly, needs OCR; check by hand |
| D-stale | Latest date found is in the past | No |
| E-no-events-on-site(-social-only) | No dated events; may link to Facebook/Instagram/WhatsApp | No — social only |
| F-no-website-known / F-unreachable | No site, or site down | No |
| X-robots-disallowed | Site asks crawlers not to read it | No — respect it |

The window includes **Navratri (11–20 October 2026)**, the busiest fortnight of
the year. A mandir with a maintained website should show it, which makes this
a fair test.

## Manual checks to add

The script can't see Facebook, Instagram or WhatsApp, which is where the brief
expects many events to live. For each mandir, also note by hand:

1. Does its Facebook page show Navratri 2026 plans? (yes / no / no page)
2. Is there a public WhatsApp channel or broadcast link?
3. One phone call or visit: "Where do you announce events?"

That third answer is the most useful number in the whole audit.

## Early signals from search (not a substitute for the live run)

- **Only 11 of 30 mandirs had a website surface in search.** That is worse than
  the brief's "about 60% have a website", though some will turn up with a
  manual look.
- **Shree Hindu Temple, Leicester** publishes a dated 2026 festival list
  including Navratri (11/10/2026) and Diwali (08/11/2026) — likely category A
  or B.
- **Shree Kutch Satsang Swaminarayan Temple, Kenton** has dated 2026 posts —
  the site is maintained.
- **Four mandirs sit on central sampradaya sites** (two ISSO pages on
  swaminarayan.faith, and very likely both BAPS mandirs on baps.org). One collector per
  sampradaya site could cover many mandirs at once — worth knowing for the
  build.
- **Searching for Navratri 2026 in Wembley, Harrow and Leicester, a week out,
  mostly returned SEO content-farm articles and commercial garba promoters**
  on ticketing aggregators, not mandir pages. Either mandirs announce on social
  channels, or their pages aren't indexed. Commercial garba is clearly a large
  part of what people search for, so the brief's open question — do promoters
  get listed? — needs an answer before launch.
