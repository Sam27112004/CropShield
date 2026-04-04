# CropShield

CropShield is an agriculture insurance workflow project with:

- A FastAPI backend for farm onboarding, claim workflows, satellite analysis, AI inference, decisioning, jobs, and reporting
- A Next.js frontend for dashboard, claim flow, analysis pages, and admin views
- Local model and data artifacts for demo/hackathon execution

This repository is rebuilt phase-by-phase from the reference project for a stable hackathon setup.

## Repository Layout

- backend: FastAPI application, DB models/migrations, services, workers, tests
- frontend: Next.js application (App Router + TypeScript + Tailwind)
- models: trained AI model artifacts
- data: local SQLite data and generated analysis/report artifacts
- utils: utility scripts copied from reference
- referance: source reference project (kept for controlled rebuild)

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Alembic, Redis, Celery, NumPy, TensorFlow, Earth Engine API
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Leaflet

## Quick Start (Windows / PowerShell)

### 1) Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Start backend:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

### 3) Open application

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Runtime Modes

### Demo-safe mode (recommended for hackathon)

Use this if Google Earth Engine permissions are not ready:

- ENABLE_EARTH_ENGINE=false
- ALLOW_DEMO_SATELLITE_FALLBACK=true
- ALLOW_HEURISTIC_AI_FALLBACK=true (if needed)
- REQUIRE_TRAINED_AI_MODEL=false (if model not available)

### Real satellite + trained model mode

Use this when cloud/project permissions are correctly configured:

- ENABLE_EARTH_ENGINE=true
- ALLOW_DEMO_SATELLITE_FALLBACK=false
- ALLOW_HEURISTIC_AI_FALLBACK=false
- REQUIRE_TRAINED_AI_MODEL=true
- AI_MODEL_PATH=models/crop_damage_cnn.keras

## Environment Notes

- Frontend reads API base URL from NEXT_PUBLIC_API_URL
- Backend reads config from backend/.env
- Artifacts are written under data/artifacts

## Common Issues

### Earth Engine 403 / PERMISSION_DENIED

Cause: credentials used by backend do not have enough IAM permissions on the configured GCP project.

Fix path:

1. Grant the caller identity access to use services in the project
2. Ensure Earth Engine API and Service Usage API are enabled
3. Restart backend after IAM propagation

If immediate continuity is needed, run demo-safe mode.

### TensorFlow warnings on Windows

Informational CPU/oneDNN messages are expected on native Windows and are not fatal.

## Development Workflow

- Work on dev branch in small phases
- Commit after each stable step
- Merge into main only after minimum viable flow is verified

## Existing Module Docs

- backend/README.md for backend-specific details
- frontend/README.md for frontend-specific details
- docs/copilot.md for controlled rebuild rules used in this repository
