from __future__ import annotations

from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

VAULT_ROOT = Path("/workspace/VibeForge-Studios")

app = FastAPI(title="Bridge Append Endpoint")


class AppendRequest(BaseModel):
    relative_path: str = Field(min_length=1)
    content: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/append")
def append_markdown(req: AppendRequest) -> dict[str, str | int]:
    if not req.relative_path.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are allowed")

    target = (VAULT_ROOT / req.relative_path).resolve()
    if VAULT_ROOT not in target.parents and target != VAULT_ROOT:
        raise HTTPException(status_code=400, detail="Path escapes vault")

    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("a", encoding="utf-8") as f:
        f.write(req.content)
        if not req.content.endswith("\n"):
            f.write("\n")

    return {"status": "appended", "path": str(target.relative_to(VAULT_ROOT)), "bytes": len(req.content.encode("utf-8"))}
