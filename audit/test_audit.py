"""Tests for audit.py, run against small fixture sites served locally.

    cd audit && python3 -m unittest test_audit -v
"""

import datetime as dt
import functools
import http.server
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import audit  # noqa: E402

START = dt.date(2026, 10, 4)
END = START + dt.timedelta(days=30)

SITES = {
    # Current events on a WordPress events-plugin page, plus a Facebook link.
    "current/robots.txt": "User-agent: *\nAllow: /\n",
    "current/index.html": """<html><body>
        <a href="/events/">Upcoming Events</a>
        <a href="https://www.facebook.com/somemandir">Facebook</a></body></html>""",
    "current/events/index.html": """<html><body><div class="tribe-events-list">
        <h3>Navratri garba</h3><p>Sunday 11th October 2026, 7pm</p>
        <h3>Diwali</h3><p>08/11/2026</p></div></body></html>""",
    # Dates in plain text and JSON-LD, no plugin.
    "plain/index.html": """<html><head><script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Event","name":"Sharad Purnima",
         "startDate":"2026-10-25T18:00"}</script></head>
        <body><p>Annakut on October 21, 2026 in the main hall.</p></body></html>""",
    # Only a 2024 programme and a PDF-free page: stale.
    "stale/index.html": """<html><body><a href="/news/">News</a>
        <p>Diwali celebrations 1 November 2024</p></body></html>""",
    "stale/news/index.html": "<html><body><p>Holi 25/03/2024</p></body></html>",
    # Events only as a poster image.
    "poster/index.html": """<html><body>
        <img src="/img/navratri-poster-2026.jpg" alt="Navratri programme"></body></html>""",
    # Robots disallow everything.
    "blocked/robots.txt": "User-agent: *\nDisallow: /\n",
    "blocked/index.html": "<html><body><p>11 October 2026</p></body></html>",
}


class FixtureServer:
    """Serves one fixture site at the server root, as a real site would be."""

    def __init__(self, site):
        self.site = site

    def __enter__(self):
        self.dir = tempfile.TemporaryDirectory()
        for rel, body in SITES.items():
            p = Path(self.dir.name, rel)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(body)
        handler = functools.partial(QuietHandler, directory=str(Path(self.dir.name, self.site)))
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        return self

    def __exit__(self, *exc):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.dir.cleanup()


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class FindDatesTest(unittest.TestCase):
    def test_formats(self):
        text = ("2026-10-11; 11/10/2026; 11th October 2026; October 11, 2026; "
                "Sun 11 Oct; 31/02/2026")
        dates = audit.find_dates(text, 2026)
        self.assertEqual({d for d, _ in dates}, {dt.date(2026, 10, 11)})
        self.assertEqual(len(dates), 5)  # the invalid 31 Feb is skipped
        self.assertEqual(sum(1 for _, explicit in dates if not explicit), 1)


class AuditSiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._delay = audit.DELAY_SECONDS
        audit.DELAY_SECONDS = 0
        os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1,localhost"

    @classmethod
    def tearDownClass(cls):
        audit.DELAY_SECONDS = cls._delay

    def run_site(self, site):
        with FixtureServer(site) as s:
            row = {"id": "1", "cluster": "t", "name": site, "website": f"{s.base}/"}
            return audit.audit_one(audit.Fetcher(), row, START, END)

    def test_categories(self):
        current = self.run_site("current")
        plain = self.run_site("plain")
        stale = self.run_site("stale")
        poster = self.run_site("poster")
        blocked = self.run_site("blocked")

        self.assertEqual(current["category"], "A-current-structured")
        self.assertEqual(current["dates_in_window"], 1)  # Diwali 8 Nov is outside
        self.assertEqual(current["plugins"], "the-events-calendar")
        self.assertEqual(current["social"], "facebook")

        self.assertEqual(plain["category"], "A-current-structured")  # via JSON-LD
        self.assertEqual(plain["jsonld_events"], 1)
        self.assertEqual(plain["dates_in_window"], 2)

        self.assertEqual(stale["category"], "D-stale")
        self.assertEqual(stale["latest_date_found"], "2024-11-01")

        self.assertEqual(poster["category"], "C-maybe-current-in-pdf-or-image")
        self.assertEqual(blocked["category"], "X-robots-disallowed")

    def test_no_website(self):
        row = {"id": "1", "cluster": "t", "name": "x", "website": ""}
        r = audit.audit_one(audit.Fetcher(), row, START, END)
        self.assertEqual(r["category"], "F-no-website-known")


if __name__ == "__main__":
    unittest.main()
