#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests


def submit_task(base_url: str, endpoint: str, task: str, project: str, priority: str, metadata: dict | None, token: str | None) -> dict:
    payload = {
        "task": task,
        "project": project,
        "priority": priority,
        "metadata": metadata or {},
    }
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    res = requests.post(f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}", json=payload, headers=headers, timeout=30)
    res.raise_for_status()
    return res.json()


def probe_endpoints(base_url: str, endpoints: list[str], token: str | None) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    out: dict[str, Any] = {}
    for endpoint in endpoints:
        url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        try:
            res = requests.options(url, headers=headers, timeout=10)
            out[endpoint] = {"status": res.status_code, "allow": res.headers.get("Allow", "")}
        except requests.RequestException as exc:
            out[endpoint] = {"error": str(exc)}
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Submit tasks to Paperclip API")
    parser.add_argument("task", help="Task text for Gordon")
    parser.add_argument("--base-url", default="http://100.84.56.42:3100", help="Paperclip API base URL")
    parser.add_argument("--project", default="gordon", help="Project tag")
    parser.add_argument("--endpoint", default="tasks", help="API endpoint path")
    parser.add_argument("--token", default=None, help="Bearer token if API requires auth")
    parser.add_argument("--priority", default="normal", choices=["low", "normal", "high", "urgent"])
    parser.add_argument("--metadata-file", help="Optional JSON metadata file")
    parser.add_argument("--dry-run", action="store_true", help="Print payload and exit without POST")
    parser.add_argument("--probe", action="store_true", help="Probe likely task endpoints with OPTIONS")
    args = parser.parse_args()

    metadata = None
    if args.metadata_file:
        metadata = json.loads(Path(args.metadata_file).read_text())

    payload_preview = {
        "task": args.task,
        "project": args.project,
        "priority": args.priority,
        "metadata": metadata or {},
        "base_url": args.base_url,
        "endpoint": args.endpoint,
    }
    if args.probe:
        print(json.dumps(probe_endpoints(args.base_url, ["tasks", "api/tasks", "v1/tasks"], args.token), indent=2))
        return
    if args.dry_run:
        print(json.dumps({"dry_run": True, "payload": payload_preview}, indent=2))
        return

    try:
        result = submit_task(args.base_url, args.endpoint, args.task, args.project, args.priority, metadata, args.token)
    except requests.HTTPError as exc:
        body = exc.response.text[:500] if exc.response is not None else ""
        print(json.dumps({"error": str(exc), "status": exc.response.status_code if exc.response else None, "body": body}, indent=2), file=sys.stderr)
        raise
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
