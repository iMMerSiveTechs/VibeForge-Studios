from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Generator

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from twilio.rest import Client

DB_PATH = os.getenv("DB_PATH", "speed_to_lead.db")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

app = FastAPI(title="Speed-to-Lead Pilot")


@contextmanager
def db_conn() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    with db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                source TEXT DEFAULT 'unknown',
                message TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                contacted INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


class LeadIn(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=7)
    source: str = "unknown"
    message: str = ""


class LeadOut(LeadIn):
    id: int
    created_at: str
    contacted: bool


def send_sms_alert(lead: LeadIn) -> bool:
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        return False

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    body = f"New lead: {lead.name} ({lead.phone}) from {lead.source}. {lead.message}".strip()
    # In pilot mode, send to same from number if no dedicated destination configured.
    to_number = os.getenv("ALERT_TO_NUMBER", TWILIO_FROM_NUMBER)
    client.messages.create(from_=TWILIO_FROM_NUMBER, to=to_number, body=body)
    return True


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/leads", response_model=LeadOut)
def create_lead(lead: LeadIn) -> LeadOut:
    now = datetime.now(timezone.utc).isoformat()
    contacted = 1 if send_sms_alert(lead) else 0

    with db_conn() as conn:
        cur = conn.execute(
            "INSERT INTO leads (name, phone, source, message, created_at, contacted) VALUES (?, ?, ?, ?, ?, ?)",
            (lead.name, lead.phone, lead.source, lead.message, now, contacted),
        )
        conn.commit()
        lead_id = cur.lastrowid

    return LeadOut(id=lead_id, created_at=now, contacted=bool(contacted), **lead.model_dump())


@app.get("/leads", response_model=list[LeadOut])
def list_leads() -> list[LeadOut]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, phone, source, message, created_at, contacted FROM leads ORDER BY id DESC"
        ).fetchall()

    return [
        LeadOut(
            id=row["id"],
            name=row["name"],
            phone=row["phone"],
            source=row["source"],
            message=row["message"],
            created_at=row["created_at"],
            contacted=bool(row["contacted"]),
        )
        for row in rows
    ]


@app.get("/leads/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int) -> LeadOut:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id, name, phone, source, message, created_at, contacted FROM leads WHERE id = ?", (lead_id,)
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    return LeadOut(
        id=row["id"],
        name=row["name"],
        phone=row["phone"],
        source=row["source"],
        message=row["message"],
        created_at=row["created_at"],
        contacted=bool(row["contacted"]),
    )
