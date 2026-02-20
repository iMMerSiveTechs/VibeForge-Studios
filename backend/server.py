from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from collections import defaultdict
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory rate limiter
_request_log: dict = defaultdict(list)


def _rate_limit(ip: str, limit: int = 10, window: int = 3600) -> bool:
    now = time.time()
    _request_log[ip] = [t for t in _request_log[ip] if now - t < window]
    if len(_request_log[ip]) >= limit:
        return False
    _request_log[ip].append(now)
    return True


# ─── Models ────────────────────────────────────────────────────────────────

class WaitlistCreate(BaseModel):
    email: EmailStr
    productKey: Literal["ecosystem", "habit", "studio", "desk"]
    goalOptional: Optional[str] = None
    sourcePage: Optional[str] = None
    hp: Optional[str] = None  # honeypot field


class SupportCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    message: str
    hp: Optional[str] = None  # honeypot field


# ─── Waitlist ───────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "VibeForge Studios API", "status": "operational"}


@api_router.post("/waitlist")
async def join_waitlist(data: WaitlistCreate, request: Request):
    # Honeypot — silently succeed for bots
    if data.hp:
        return {"success": True, "message": "You're in. Founder access will be sent at launch."}

    client_ip = request.client.host if request.client else "unknown"
    if not _rate_limit(client_ip, limit=15, window=3600):
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    existing = await db.waitlist.find_one(
        {"email": str(data.email), "productKey": data.productKey},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already on the list.")

    doc = {
        "id": str(uuid.uuid4()),
        "email": str(data.email),
        "productKey": data.productKey,
        "goalOptional": data.goalOptional,
        "sourcePage": data.sourcePage,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.waitlist.insert_one(doc)
    logger.info(f"Waitlist signup: {data.email} → {data.productKey}")
    return {"success": True, "message": "You're in. Founder access will be sent at launch."}


@api_router.get("/waitlist/count")
async def waitlist_count():
    total = await db.waitlist.count_documents({})
    return {"total": total}


# ─── Support ────────────────────────────────────────────────────────────────

@api_router.post("/support")
async def submit_support(data: SupportCreate, request: Request):
    if data.hp:
        return {"success": True}

    client_ip = request.client.host if request.client else "unknown"
    if not _rate_limit(client_ip, limit=5, window=3600):
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    if len(data.message.strip()) < 10:
        raise HTTPException(status_code=400, detail="Message too short.")

    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": str(data.email),
        "message": data.message.strip(),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.support_messages.insert_one(doc)
    logger.info(f"Support message from: {data.email}")
    return {"success": True, "message": "Message received. We'll be in touch."}


# ─── App setup ──────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
