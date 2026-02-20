import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ── Health ──────────────────────────────────────────────────────────────────

def test_api_root():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "operational"

# ── Waitlist ─────────────────────────────────────────────────────────────────

def test_waitlist_join_ecosystem():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "TEST_eco@vibetest.com",
        "productKey": "ecosystem"
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True
    assert "You're in" in data.get("message", "")

def test_waitlist_join_habit():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "TEST_habit@vibetest.com",
        "productKey": "habit",
        "goalOptional": "Focus"
    })
    assert r.status_code == 200

def test_waitlist_join_studio():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "TEST_studio@vibetest.com",
        "productKey": "studio"
    })
    assert r.status_code == 200

def test_waitlist_join_desk():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "TEST_desk@vibetest.com",
        "productKey": "desk"
    })
    assert r.status_code == 200

def test_waitlist_duplicate_returns_409():
    # Submit the same email+product again
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "TEST_eco@vibetest.com",
        "productKey": "ecosystem"
    })
    assert r.status_code == 409
    assert "Already on the list" in r.json().get("detail", "")

def test_waitlist_invalid_email():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "not-an-email",
        "productKey": "ecosystem"
    })
    assert r.status_code == 422

def test_waitlist_invalid_product():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "valid@example.com",
        "productKey": "invalid-product"
    })
    assert r.status_code == 422

def test_waitlist_honeypot_silently_succeeds():
    r = requests.post(f"{BASE_URL}/api/waitlist", json={
        "email": "bot@spam.com",
        "productKey": "ecosystem",
        "hp": "filled-by-bot"
    })
    assert r.status_code == 200

def test_waitlist_count():
    r = requests.get(f"{BASE_URL}/api/waitlist/count")
    assert r.status_code == 200
    assert "total" in r.json()

# ── Support ───────────────────────────────────────────────────────────────────

def test_support_submit():
    r = requests.post(f"{BASE_URL}/api/support", json={
        "name": "Test User",
        "email": "TEST_support@vibetest.com",
        "message": "This is a test support message for automated testing."
    })
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True

def test_support_message_too_short():
    r = requests.post(f"{BASE_URL}/api/support", json={
        "email": "short@vibetest.com",
        "message": "Hi"
    })
    assert r.status_code == 400

def test_support_invalid_email():
    r = requests.post(f"{BASE_URL}/api/support", json={
        "email": "bademail",
        "message": "A longer message for testing purposes"
    })
    assert r.status_code == 422

def test_support_honeypot():
    r = requests.post(f"{BASE_URL}/api/support", json={
        "email": "bot@spam.com",
        "message": "Spam message",
        "hp": "bot-value"
    })
    assert r.status_code == 200
