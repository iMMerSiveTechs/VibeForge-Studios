import os
from fastapi.testclient import TestClient

os.environ["DB_PATH"] = "test_speed_to_lead.db"

from app import app, init_db


client = TestClient(app)


def setup_module():
    if os.path.exists("test_speed_to_lead.db"):
        os.remove("test_speed_to_lead.db")
    init_db()


def teardown_module():
    if os.path.exists("test_speed_to_lead.db"):
        os.remove("test_speed_to_lead.db")


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_create_and_fetch_lead():
    payload = {"name": "Jane Doe", "phone": "+15305550100", "source": "web", "message": "Need roof inspection"}
    create_res = client.post("/leads", json=payload)
    assert create_res.status_code == 200
    lead = create_res.json()
    assert lead["name"] == "Jane Doe"

    lead_res = client.get(f"/leads/{lead['id']}")
    assert lead_res.status_code == 200
    assert lead_res.json()["phone"] == payload["phone"]
