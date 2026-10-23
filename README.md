# SafePath

SafePath is a Nagpur-focused urban safety decision-support platform that helps residents understand route risk, submit incident reports with evidence, and let administrators moderate public safety data before it influences zone scores.

The system combines a React frontend, an Express/MongoDB backend, and a Python ML microservice to score police-station catchment areas, analyze corridors between zones, and classify incident descriptions.

## What the project does

- Evaluates a journey between two locations by comparing the safety of Nagpur zones and recommending lower-risk corridors
- Displays area-level risk scores and zone metadata on an interactive map UI
- Accepts citizen incident reports with mandatory evidence images and AI-assisted incident classification
- Requires admin review before accepted reports affect public risk calculations
- Maintains audit logs for moderation decisions and report history

## Project structure

```text
safepath_1/
+-- client/                 # React + Vite frontend UI
+-- server/                 # Express API, MongoDB models, risk engine, auth
+-- ml/                     # Flask microservice for incident classification
+-- docs/                   # ADRs and implementation notes
+-- scripts/                # Data extraction utilities
+-- README.md               # Project overview and setup
+-- package.json            # Root convenience scripts
+-- SAFEPath_Harness_Engineering.md
+-- .gitignore
```

## Tech stack

- Frontend: React 18, Vite, Tailwind CSS, Leaflet, React-Leaflet, Axios
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- ML service: Python 3, Flask, scikit-learn, pandas, numpy, joblib
- Testing: Jest + Supertest for the API, pytest for the ML service

## Architecture and behavior

### Frontend
The React app provides pages for:

- home view with route analysis and zone metrics
- signup/login flows
- citizen incident reporting with evidence upload
- admin moderation console for review and audit actions

### Backend
The Express server exposes the core API and contains:

- auth routes and JWT-based access control
- area lookup endpoints for Nagpur police-station catchments
- navigation analysis for source/destination corridor evaluation
- report submission, retrieval, review, and audit-log endpoints
- authoritative risk scoring based on accepted incidents and historical baselines

### ML microservice
The Python service listens on port 5001 and exposes:

- GET /health
- POST /predict

It predicts the incident class from a free-text description using a TF-IDF + Logistic Regression pipeline and returns a confidence score.

## Data model summary

SafePath uses MongoDB collections for users, areas, reports, and audit logs. The actual schema in this codebase includes:

- users: auth and role data (user or admin)
- areas: Nagpur area metadata, risk score, risk level, center coordinates, neighbors, and historical baseline data
- reports: submitted incidents with description, ML prediction, evidence image URLs, review state, and admin moderation details
- audit_logs: actions taken by users/admins for review and investigation

A key application rule in the current code is that a report stays in pending_review until an admin accepts or rejects it. Only accepted reports are used to recalibrate area risk.

## Quick start

### Prerequisites

- Node.js 18+
- npm
- Python 3.9+
- MongoDB running locally at mongodb://localhost:27017/safepath

### 1) Install dependencies

```bash
cd server
npm install

cd ../client
npm install

cd ../ml
python -m pip install -r requirements.txt
```

### 2) Configure environment

Create the backend environment file:

```bash
cd ../server
cp .env.example .env
```

The default values are:

- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/safepath
- JWT_SECRET=safepath_super_secret_jwt_key_2026
- ML_SERVICE_URL=http://localhost:5001
- ML_CONFIDENCE_THRESHOLD=0.35

### 3) Seed the database

```bash
cd server
npm run seed
```

This creates demo users and imports Nagpur station data into MongoDB.

### 4) Start the services

Terminal 1: ML microservice

```bash
cd ml
python app.py
```

Terminal 2: backend API

```bash
cd server
npm run dev
```

Terminal 3: frontend

```bash
cd client
npm run dev
```

The frontend runs on http://localhost:3000 and proxies API requests to the backend on http://localhost:5000.

## Convenience scripts at repo root

```bash
npm run dev:server
npm run dev:client
npm run dev:ml
npm run seed
npm run test
npm run build
```

## Demo accounts

After seeding the database, use these credentials:

- Admin: admin@safepath.nagpur / Admin@12345
- User: user@safepath.nagpur / User@12345

## API overview

### Authentication

- POST /api/auth/signup - register a user account
- POST /api/auth/login - log in and receive a JWT
- GET /api/auth/me - fetch current authenticated user

### Area and navigation data

- GET /api/areas - list Nagpur risk zones / catchment areas
- GET /api/areas/:id - fetch one area by ID
- POST /api/navigation - analyze a source-destination journey and return safer corridor guidance

### Incident reporting

- GET /api/reports - list reports with filters and role-based access
- GET /api/reports/:id - fetch a single report with RBAC checks
- POST /api/reports - create a report with description + evidence files
- PATCH /api/reports/:id/review - accept, reject, or archive a report as admin
- GET /api/reports/audit/logs - retrieve moderation audit trail

### Health

- GET /api/health - checks whether the API and ML service are reachable

Note: POST /api/reports accepts multipart form data, not JSON, because evidence images are uploaded alongside the description.

## Risk and moderation model

The project is designed around two important rules:

1. The ML service predicts the incident category from text only.
2. Public risk scoring is influenced only by admin-approved incidents.

This means a report can be submitted and queued in pending_review without immediately impacting public risk, which keeps the platform aligned with a human moderation and verification workflow.

## Project documentation

The repository includes ADRs that explain the design choices behind the app:

- [ADR 001: Maps with Leaflet & OpenStreetMap](./docs/adr/001-maps-leaflet-openstreetmap.md)
- [ADR 002: Predefined Zone Recommendations vs Turn-by-Turn](./docs/adr/002-zone-based-recommendations.md)
- [ADR 003: Incident Classification with TF-IDF & Logistic Regression](./docs/adr/003-ml-incident-classification.md)
- [ADR 004: Authoritative Dynamic Risk Scoring Engine](./docs/adr/004-risk-scoring.md)

## Limitations

- The platform is geospatially scoped to Nagpur and uses predefined police-station catchment areas rather than street-level routing.
- Historical data is intended for demo and evaluation scenarios, not as official municipal or law-enforcement data.
- Risk scores are decision-support estimates generated from available local data and AI-assisted classification.
