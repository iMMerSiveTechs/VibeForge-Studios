#!/usr/bin/env python3
"""Fleet conversation archive scraper (v1).

Logs into supported AI platforms via Playwright using cookies or manual login,
enumerates conversation URLs from history/sidebar, captures thread text, and
writes markdown archives + manifest. Resumable via checkpoint.json.
"""
from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from markdownify import markdownify as md
from playwright.sync_api import sync_playwright


@dataclass
class PlatformSpec:
    name: str
    base_url: str
    history_url: str
    thread_pattern: str


PLATFORMS = {
    "chatgpt": PlatformSpec("chatgpt", "https://chatgpt.com", "https://chatgpt.com/", r"chatgpt\\.com/c/[A-Za-z0-9\\-]+"),
    "claude": PlatformSpec("claude", "https://claude.ai", "https://claude.ai/chats", r"claude\\.ai/chat/[A-Za-z0-9\\-]+"),
    "gemini": PlatformSpec("gemini", "https://gemini.google.com", "https://gemini.google.com/app", r"gemini\\.google\\.com/app/[A-Za-z0-9\\-]+"),
    "grok": PlatformSpec("grok", "https://grok.com", "https://grok.com", r"grok\\.com/chat/[A-Za-z0-9\\-]+"),
    "perplexity": PlatformSpec("perplexity", "https://www.perplexity.ai", "https://www.perplexity.ai", r"perplexity\\.ai/search/[A-Za-z0-9\\-]+"),
}


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_")
    return value[:120] or "untitled"


def load_json(path: Path, default: Any) -> Any:
    return json.loads(path.read_text()) if path.exists() else default


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))


def collect_thread_urls(page, spec: PlatformSpec, scroll_rounds: int = 25) -> list[str]:
    page.goto(spec.history_url, wait_until="domcontentloaded", timeout=120000)
    urls: set[str] = set()
    for _ in range(scroll_rounds):
        page.mouse.wheel(0, 4000)
        time.sleep(0.7)
        hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        for href in hrefs:
            if re.search(spec.thread_pattern, href):
                urls.add(href)
    return sorted(urls)


def extract_thread(page, url: str) -> tuple[str, str]:
    page.goto(url, wait_until="networkidle", timeout=120000)
    time.sleep(2)
    title = page.title() or "untitled"
    html = page.content()
    text_md = md(html, heading_style="ATX")
    return title, text_md


def ensure_login(page, spec: PlatformSpec) -> None:
    page.goto(spec.history_url, wait_until="domcontentloaded", timeout=120000)
    print(f"[{spec.name}] Confirm authenticated session in browser, then press Enter...")
    input()


def run(cfg: dict[str, Any], target_platforms: list[str]) -> None:
    out_root = Path(cfg.get("output_root", "/vault/_bridge/archives"))
    state_root = Path(cfg.get("state_root", "./state"))
    manifest_path = state_root / "manifest.json"
    checkpoint_path = state_root / "checkpoint.json"
    manifest = load_json(manifest_path, {"generated_at": None, "threads": []})
    checkpoint = load_json(checkpoint_path, {"done": {}})

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=cfg.get("headless", False), args=["--disable-blink-features=AutomationControlled"])
        for platform in target_platforms:
            spec = PLATFORMS[platform]
            print(f"=== {platform} ===")
            storage_state_path = cfg.get("platforms", {}).get(platform, {}).get("storage_state")
            context = browser.new_context(storage_state=storage_state_path if storage_state_path and Path(storage_state_path).exists() else None)
            page = context.new_page()
            ensure_login(page, spec)
            urls = collect_thread_urls(page, spec, cfg.get("scroll_rounds", 25))
            print(f"{platform}: found {len(urls)} thread urls")
            done = set(checkpoint.get("done", {}).get(platform, []))
            for url in urls:
                if url in done:
                    continue
                try:
                    title, content = extract_thread(page, url)
                    thread_id = url.rstrip("/").split("/")[-1]
                    fname = f"{thread_id}_{slugify(title)}.md"
                    out_path = out_root / platform / fname
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    out_path.write_text(f"# {title}\n\nSource: {url}\n\n{content}")
                    manifest["threads"].append({
                        "platform": platform,
                        "thread_id": thread_id,
                        "title": title,
                        "url": url,
                        "path": str(out_path),
                        "saved_at": datetime.now(timezone.utc).isoformat(),
                    })
                    done.add(url)
                    checkpoint.setdefault("done", {})[platform] = sorted(done)
                    save_json(checkpoint_path, checkpoint)
                    save_json(manifest_path, manifest)
                    print(f"saved: {out_path}")
                except Exception as exc:
                    print(f"error on {url}: {exc}")
            context.storage_state(path=str(state_root / f"{platform}.storage_state.json"))
            context.close()
        browser.close()

    manifest["generated_at"] = datetime.now(timezone.utc).isoformat()
    save_json(manifest_path, manifest)
    print("done")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--platform", action="append", choices=sorted(PLATFORMS.keys()))
    args = parser.parse_args()
    cfg = yaml.safe_load(Path(args.config).read_text())
    selected = args.platform or cfg.get("platform_order", list(PLATFORMS.keys()))
    run(cfg, selected)


if __name__ == "__main__":
    main()
