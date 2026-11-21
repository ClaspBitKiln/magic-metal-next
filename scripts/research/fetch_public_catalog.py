#!/usr/bin/env python3
"""Read a public product page into evidence JSON; dependency-free Crawl4AI fallback.

Usage: python scripts/research/fetch_public_catalog.py https://example.com/page
Respects robots.txt, never logs in, never posts data, and keeps inventory unverified.
"""
import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

USER_AGENT = "MagicMetalCatalogResearch/1.0 (+https://magicmet.ru)"
MAX_BYTES = 1_000_000

class TextReader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.hidden += 1
        if tag in ("p", "h1", "h2", "h3", "li", "tr", "td", "th"):
            self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self.hidden:
            self.hidden -= 1
    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)

def collect(url, timeout=15):
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Only public HTTPS URLs without credentials are supported")
    robot = RobotFileParser()
    robot.set_url(f"{parsed.scheme}://{parsed.netloc}/robots.txt")
    robot.read()
    if not robot.can_fetch(USER_AGENT, url):
        raise PermissionError("robots.txt disallows this URL or cannot be checked")
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urlopen(req, timeout=timeout) as response:
        final_url = response.geturl()
        if urlparse(final_url).hostname != parsed.hostname:
            raise ValueError("Cross-host redirect requires a new robots.txt check")
        if "text/html" not in response.headers.get("Content-Type", "").lower():
            raise ValueError("Not an HTML page")
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError("Page exceeds 1 MB limit")
        charset = response.headers.get_content_charset() or "utf-8"
    parser = TextReader()
    parser.feed(raw.decode(charset, errors="replace"))
    text = re.sub(r"[ \t]+", " ", "".join(parser.parts))
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    return {
        "url": final_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "evidence_type": "public_html",
        "verification_status": "unverified_extraction",
        "inventory_claim": False,
        "text_excerpt": text[:15000],
        "note": "Extracted text is not confirmation of grade/size/standard compatibility."
    }

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("url")
    args = p.parse_args()
    try:
        print(json.dumps(collect(args.url), ensure_ascii=False, indent=2))
    except (ValueError, PermissionError, HTTPError, URLError, TimeoutError, OSError) as exc:
        print(json.dumps({"url": args.url, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
