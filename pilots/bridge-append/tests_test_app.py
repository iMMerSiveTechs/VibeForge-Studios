from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_append_markdown():
    res = client.post('/append', json={'relative_path': 'memory/bridge-test.md', 'content': 'hello'})
    assert res.status_code == 200
    assert res.json()['status'] == 'appended'
