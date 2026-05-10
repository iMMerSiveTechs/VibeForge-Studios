#!/usr/bin/env python3
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
OPENCLAW_URL = os.environ.get("OPENCLAW_URL", "http://100.84.56.42:18789")
GORDON_PROFILE = os.environ.get("GORDON_PROFILE", "gordon")

@app.post("/route")
def route():
    payload = request.get_json(force=True)
    msg = payload.get("message", "")
    r = requests.post(f"{OPENCLAW_URL}/agent/{GORDON_PROFILE}/message", json={"message": msg}, timeout=120)
    r.raise_for_status()
    data = r.json()
    return jsonify({"response": data.get("response", "")})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 18790)))
