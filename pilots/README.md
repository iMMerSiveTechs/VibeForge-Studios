# FleetForge Pilot Services

## 1) Speed-to-Lead Twilio Pilot

Location: `pilots/speed-to-lead`

Run:

```bash
cd pilots/speed-to-lead
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8010
```

Endpoints:
- `GET /health`
- `POST /leads`
- `GET /leads`
- `GET /leads/{id}`

## 2) Bridge Append Endpoint

Location: `pilots/bridge-append`

Run:

```bash
cd pilots/bridge-append
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8011
```

Endpoints:
- `GET /health`
- `POST /append` (append content into markdown files under vault root)

## Deploy Quick Start (single VM)
Use two systemd services, one per app, each with its own virtualenv. Put behind Caddy/Nginx with:
- `speedlead.yourdomain.com -> :8010`
- `bridge.yourdomain.com -> :8011`
