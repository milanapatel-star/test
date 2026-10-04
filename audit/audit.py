"""Audit mandir websites for current, collectable event listings.

For each mandir in mandirs.csv with a website, this checks robots.txt, reads the
homepage and up to five likely events pages, and records:

- whether the site lists dated events inside the audit window (default: the
  next 30 days)
- what form they take (structured data, plain page text, PDF, poster image)
- the latest event date found anywhere, to spot stale sites
- links to social channels, where events may live instead

Only the Python standard library is used. The crawler identifies itself, obeys
robots.txt and waits between requests.

    python3 audit/audit.py                       # window = today + 30 days
    python3 audit/audit.py --start 2026-10-04 --days 30
"""

import argparse
import csv
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).parent
USER_AGENT = "UtsavAuditBot/0.1 (one-off research audit; contact via repo owner)"
DELAY_SECONDS = 2.0
TIMEOUT = 20
MAX_EVENT_PAGES = 5

EVENT_LINK_WORDS = (
    "event", "calendar", "programme", "program", "festival", "whats-on",
    "what's on", "utsav", "navratri", "diwali", "upcoming", "news", "notice",
)
SOCIAL_HOSTS = {
    "facebook": ("facebook.com", "fb.com", "fb.me"),
    "instagram": ("instagram.com",),
    "whatsapp": ("whatsapp.com", "wa.me"),
    "youtube": ("youtube.com", "youtu.be"),
    "x": ("twitter.com", "x.com"),
}
# Signatures of common WordPress/Wix/Squarespace event plugins and embeds.
PLUGIN_SIGNATURES = {
    "the-events-calendar": ("tribe-events", "tribe_events"),
    "eventon": ("eventon", "evo_"),
    "events-manager": ("em-events", "events-manager"),
    "modern-events-calendar": ("mec-event", "mec-wrap"),
    "wix-events": ("wix-events", "events-widget"),
    "squarespace-events": ("eventlist-event",),
    "google-calendar-embed": ("calendar.google.com/calendar/embed",),
    "eventbrite-embed": ("eventbrite.", "eventbrite-widget"),
}

MONTHS = {
    m: i for i, names in enumerate(
        [("jan", "january"), ("feb", "february"), ("mar", "march"),
         ("apr", "april"), ("may",), ("jun", "june"), ("jul", "july"),
         ("aug", "august"), ("sep", "sept", "september"), ("oct", "october"),
         ("nov", "november"), ("dec", "december")], start=1)
    for m in names
}
_MON = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
_ORD = r"(?:st|nd|rd|th)?"
DATE_PATTERNS = [
    # 2026-10-11
    ("ymd", re.compile(r"\b(20\d\d)-(\d{1,2})-(\d{1,2})\b")),
    # 11/10/2026, 11.10.2026, 11-10-2026 (UK day-first)
    ("dmy_num", re.compile(r"\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d\d)\b")),
    # 11 October 2026, 11th Oct 2026
    ("d_mon_y", re.compile(rf"\b(\d{{1,2}}){_ORD}\s+(?:of\s+)?{_MON}\.?,?\s+(20\d\d)\b", re.I)),
    # October 11, 2026
    ("mon_d_y", re.compile(rf"\b{_MON}\.?\s+(\d{{1,2}}){_ORD},?\s+(20\d\d)\b", re.I)),
    # 11 October / 11th Oct (no year)
    ("d_mon", re.compile(rf"\b(\d{{1,2}}){_ORD}\s+(?:of\s+)?{_MON}\b(?!\.?,?\s+20\d\d)", re.I)),
]


class PageParser(HTMLParser):
    """Collects visible text, links, JSON-LD blocks and image info."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text_parts, self.links, self.images, self.jsonld = [], [], [], []
        self._skip = 0
        self._in_jsonld = False
        self._jsonld_buf = []
        self._link_href = None
        self._link_text = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript"):
            if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
                self._in_jsonld = True
                self._jsonld_buf = []
            else:
                self._skip += 1
        elif tag == "a" and a.get("href"):
            self._link_href = a["href"]
            self._link_text = []
        elif tag == "img":
            self.images.append(" ".join(filter(None, [a.get("src"), a.get("alt")])))
        elif tag == "iframe" and a.get("src"):
            self.links.append((a["src"], "iframe"))

    def handle_endtag(self, tag):
        if tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_buf))
            self._in_jsonld = False
        elif tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1
        elif tag == "a" and self._link_href is not None:
            self.links.append((self._link_href, " ".join(self._link_text).strip()))
            self._link_href = None

    def handle_data(self, data):
        if self._in_jsonld:
            self._jsonld_buf.append(data)
        elif not self._skip:
            self.text_parts.append(data)
            if self._link_href is not None:
                self._link_text.append(data.strip())

    @property
    def text(self):
        return re.sub(r"\s+", " ", " ".join(self.text_parts))


def find_dates(text, default_year):
    """Return a list of (date, had_explicit_year) found in free text."""
    found = []
    for kind, pat in DATE_PATTERNS:
        for m in pat.finditer(text):
            g = m.groups()
            try:
                if kind == "ymd":
                    d = dt.date(int(g[0]), int(g[1]), int(g[2]))
                elif kind == "dmy_num":
                    d = dt.date(int(g[2]), int(g[1]), int(g[0]))
                elif kind == "d_mon_y":
                    d = dt.date(int(g[2]), MONTHS[g[1].lower()], int(g[0]))
                elif kind == "mon_d_y":
                    d = dt.date(int(g[2]), MONTHS[g[0].lower()], int(g[1]))
                else:
                    d = dt.date(default_year, MONTHS[g[1].lower()], int(g[0]))
            except (ValueError, KeyError):
                continue
            found.append((d, kind != "d_mon"))
    return found


def jsonld_events(blocks):
    """Count schema.org Event objects and return their start dates."""
    dates = []

    def walk(node):
        if isinstance(node, list):
            for n in node:
                walk(n)
        elif isinstance(node, dict):
            types = node.get("@type")
            types = types if isinstance(types, list) else [types]
            if any(isinstance(t, str) and t.endswith("Event") for t in types):
                sd = str(node.get("startDate", ""))[:10]
                try:
                    dates.append(dt.date.fromisoformat(sd))
                except ValueError:
                    dates.append(None)
            for v in node.values():
                walk(v)

    for b in blocks:
        try:
            walk(json.loads(b))
        except json.JSONDecodeError:
            continue
    return dates


class Fetcher:
    def __init__(self):
        self._last = 0.0
        self._robots = {}

    def allowed(self, url):
        parts = urllib.parse.urlsplit(url)
        root = f"{parts.scheme}://{parts.netloc}"
        if root not in self._robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                body = self.get(root + "/robots.txt", check_robots=False)[1]
                rp.parse(body.splitlines())
            except Exception:
                rp.parse([])  # unreachable robots.txt: treat as allow-all
            self._robots[root] = rp
        return self._robots[root].can_fetch(USER_AGENT, url)

    def get(self, url, check_robots=True):
        if check_robots and not self.allowed(url):
            raise PermissionError("disallowed by robots.txt")
        wait = DELAY_SECONDS - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                ctype = r.headers.get("Content-Type", "")
                raw = r.read(3_000_000)
                return r.geturl(), raw.decode("utf-8", "replace"), ctype
        finally:
            self._last = time.monotonic()


def same_site(a, b):
    strip = lambda h: h.lower().removeprefix("www.")
    return strip(urllib.parse.urlsplit(a).netloc) == strip(urllib.parse.urlsplit(b).netloc)


def audit_one(fetcher, row, start, end):
    out = {
        "id": row["id"], "cluster": row["cluster"], "name": row["name"],
        "website": row["website"], "reachable": "", "robots_ok": "",
        "event_pages_checked": 0, "dates_in_window": 0, "jsonld_events": 0,
        "plugins": "", "pdf_links": 0, "poster_images": 0, "ics_feed": "",
        "latest_date_found": "", "social": "", "category": "", "notes": "",
    }
    url = row["website"].strip()
    if not url:
        out["category"] = "F-no-website-known"
        return out
    try:
        final, html, _ = fetcher.get(url)
    except PermissionError:
        out.update(reachable="yes", robots_ok="no", category="X-robots-disallowed")
        return out
    except Exception as e:  # network errors, HTTP errors, timeouts
        out.update(reachable="no", category="F-unreachable", notes=str(e)[:120])
        return out
    out.update(reachable="yes", robots_ok="yes")

    pages = [(final, html)]
    home = PageParser()
    home.feed(html)
    candidates = []
    for href, text in home.links:
        absu = urllib.parse.urljoin(final, href).split("#")[0]
        hay = (href + " " + text).lower()
        if (absu.startswith("http") and same_site(absu, final) and absu != final
                and any(w in hay for w in EVENT_LINK_WORDS) and absu not in candidates):
            candidates.append(absu)
    for c in candidates[:MAX_EVENT_PAGES]:
        try:
            u, h, ctype = fetcher.get(c)
            if "html" in ctype or not ctype:
                pages.append((u, h))
        except Exception:
            continue
    out["event_pages_checked"] = len(pages) - 1

    social, plugins = set(), set()
    in_window, all_dates, jsonld_n, pdfs, posters, ics = 0, [], 0, 0, 0, False
    for page_url, page_html in pages:
        p = PageParser()
        p.feed(page_html)
        low = page_html.lower()
        for name, sigs in PLUGIN_SIGNATURES.items():
            if any(s in low for s in sigs):
                plugins.add(name)
        if ".ics" in low or "webcal:" in low or "ical=1" in low:
            ics = True
        for href, _ in p.links:
            h = href.lower()
            for net, hosts in SOCIAL_HOSTS.items():
                if any(x in h for x in hosts):
                    social.add(net)
            if h.split("?")[0].endswith(".pdf"):
                pdfs += 1
        posters += sum(
            1 for i in p.images
            if re.search(r"poster|flyer|leaflet|event|navratri|diwali|programme|utsav", i, re.I))
        ld = jsonld_events(p.jsonld)
        jsonld_n += len(ld)
        dates = [d for d, _ in find_dates(p.text, start.year)] + [d for d in ld if d]
        all_dates += dates
        in_window += sum(1 for d in set(dates) if start <= d <= end)

    plausible = [d for d in all_dates if d <= end + dt.timedelta(days=400)]
    out.update(
        dates_in_window=in_window, jsonld_events=jsonld_n,
        plugins=";".join(sorted(plugins)), pdf_links=pdfs, poster_images=posters,
        ics_feed="yes" if ics else "", social=";".join(sorted(social)),
        latest_date_found=max(plausible).isoformat() if plausible else "",
    )
    out["category"] = categorise(out, start)
    return out


def categorise(o, start):
    structured = o["jsonld_events"] or o["plugins"] or o["ics_feed"]
    if o["dates_in_window"]:
        return "A-current-structured" if structured else "B-current-in-page-text"
    if o["pdf_links"] or o["poster_images"]:
        return "C-maybe-current-in-pdf-or-image"
    latest = o["latest_date_found"]
    if latest and latest < start.isoformat():
        return "D-stale"
    return "E-no-events-on-site" + ("-social-only" if o["social"] else "")


def summarise(results, start, end):
    counts = {}
    for r in results:
        counts[r["category"]] = counts.get(r["category"], 0) + 1
    total = len(results)
    collectable = sum(v for k, v in counts.items() if k[0] in "AB")
    lines = [
        f"# Mandir website audit — {start} to {end}", "",
        f"{total} mandirs checked. **{collectable} ({collectable * 100 // max(total, 1)}%) "
        "show dated events in the window in a form that can be collected automatically.**", "",
        "| Category | Count |", "|---|---|",
    ]
    lines += [f"| {k} | {v} |" for k, v in sorted(counts.items())]
    lines += ["", "| # | Mandir | Category | In window | Latest date | Social |", "|---|---|---|---|---|---|"]
    for r in results:
        lines.append(f"| {r['id']} | {r['name']} | {r['category']} | {r['dates_in_window']} | "
                     f"{r['latest_date_found']} | {r['social']} |")
    lines += ["", "Categories A–E are heuristics. Check every B and C row by hand before "
              "relying on the totals."]
    return "\n".join(lines) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--start", type=dt.date.fromisoformat, default=dt.date.today())
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--input", type=Path, default=HERE / "mandirs.csv")
    ap.add_argument("--outdir", type=Path, default=HERE / "results")
    args = ap.parse_args(argv)
    end = args.start + dt.timedelta(days=args.days)

    with open(args.input, newline="") as f:
        rows = list(csv.DictReader(f))
    fetcher = Fetcher()
    results = []
    for row in rows:
        print(f"[{row['id']:>2}] {row['name']} ...", file=sys.stderr, end=" ", flush=True)
        r = audit_one(fetcher, row, args.start, end)
        print(r["category"], file=sys.stderr)
        results.append(r)

    args.outdir.mkdir(parents=True, exist_ok=True)
    with open(args.outdir / "results.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0]))
        w.writeheader()
        w.writerows(results)
    (args.outdir / "summary.md").write_text(summarise(results, args.start, end))
    print(f"Wrote {args.outdir / 'results.csv'} and {args.outdir / 'summary.md'}", file=sys.stderr)


if __name__ == "__main__":
    main()
