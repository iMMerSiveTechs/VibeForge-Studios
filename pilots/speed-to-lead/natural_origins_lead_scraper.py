#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from typing import Any

import requests

OVERPASS_URLS = ["http://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter"]


def build_query(county: str, state: str = "Oregon") -> str:
    area_name = f"{county} County, {state}, USA"
    return f"""
[out:json][timeout:180];
area["name"="{area_name}"]->.searchArea;
(
  nwr["shop"="roofing"](area.searchArea);
  nwr["craft"="roofer"](area.searchArea);
  nwr["office"="company"]["name"~"roof|Roof|ROOF"](area.searchArea);
);
out center tags;
"""


def scrape_county(county: str) -> list[dict[str, Any]]:
    query = build_query(county)
    last_err = None
    data = None
    session = requests.Session()
    session.trust_env = False
    for overpass_url in OVERPASS_URLS:
        try:
            res = session.get(overpass_url, params={"data": query}, timeout=240)
            res.raise_for_status()
            data = res.json()
            break
        except Exception as exc:
            last_err = exc
    if data is None:
        raise RuntimeError(f"All Overpass endpoints failed: {last_err}")
    leads = []
    seen = set()
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        key = (name.lower().strip(), (tags.get("phone") or tags.get("contact:phone", "")).strip())
        if key in seen:
            continue
        seen.add(key)
        leads.append(
            {
                "county": county,
                "name": name,
                "phone": tags.get("phone") or tags.get("contact:phone", ""),
                "website": tags.get("website") or tags.get("contact:website", ""),
                "email": tags.get("email") or tags.get("contact:email", ""),
                "city": tags.get("addr:city", ""),
                "source": "openstreetmap-overpass",
            }
        )
    return leads


def main() -> None:
    parser = argparse.ArgumentParser(description="Natural Origins lead scraper")
    parser.add_argument("--counties", nargs="+", default=["Douglas", "Coos", "Lane"])
    parser.add_argument("--out", default="natural_origins_leads.csv")
    parser.add_argument("--allow-empty", action="store_true", help="Exit 0 even if no leads were found")
    args = parser.parse_args()

    all_leads: list[dict[str, Any]] = []
    for county in args.counties:
        leads = scrape_county(county)
        print(f"{county}: {len(leads)} leads")
        all_leads.extend(leads)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["county", "name", "phone", "website", "email", "city", "source"])
        writer.writeheader()
        writer.writerows(all_leads)

    if not all_leads and not args.allow_empty:
        raise SystemExit("No leads found. Use --allow-empty to suppress non-zero exit.")

    print(json.dumps({"total": len(all_leads), "output": args.out}, indent=2))


if __name__ == "__main__":
    main()
