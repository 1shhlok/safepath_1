# SafePath — AI-Assisted Urban Safety Decision-Support System

> **Nagpur, Maharashtra** | Decision-support platform for urban safety, zone-level corridor evaluation, and real-time incident classification.

---

## 1. Product Overview

**SafePath** is an AI-assisted urban safety decision-support application specifically designed for Nagpur, Maharashtra. When citizens plan a journey between two locations, SafePath analyzes predefined urban zones, evaluates historical incident density and severity, and highlights **Areas to Follow** (safer corridors) and **Areas to Avoid** (elevated risk zones).

### What SafePath Is NOT
- **Not a turn-by-turn road navigation system** (does NOT construct road graphs, use Dijkstra, or draw blue route polylines).
- **Not a police crime verification service** (ML classifies natural language descriptions; it does not legally verify crime occurrences).
- **Not a personal safety guarantor** (all outputs are probabilistic decision-support estimates based on available data).

---

## 2. Architecture & Tech Stack

```text
safepath/
├── client/          # React 18 + Vite + Tailwind CSS + Leaflet + React-Leaflet
├── server/          # Node.js + Express + Mongoose + JWT + bcrypt + Authoritative Risk Engine
├── ml/              # Python microservice (Flask + scikit-learn TF-IDF + Logistic Regression)
├── docs/            # Architecture Decision Records (ADRs)
├── README.md        # Documentation
└── SAFEPath_Harness_Engineering.md # Engineering Contract
```

### Stack Details
- **Frontend**: React 18, Tailwind CSS, Leaflet, React-Leaflet, OpenStreetMap, Axios, Lucide React
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT, bcryptjs
- **ML Microservice**: Python 3, scikit-learn, Pandas, NumPy, Joblib, Flask, Flask-CORS
- **Testing**: Jest, Supertest (Node.js), Pytest (Python)

---

## 3. Database Schema

SafePath uses exactly three MongoDB collections:

### 1. `users`
```json
{
  "_id": "ObjectId",
  "name": "Ramesh Deshmukh",
  "email": "user@safepath.nagpur",
  "password": "<bcrypt_hash>",
  "role": "user | admin",
  "createdAt": "2026-08-29T22:00:00.000Z"
}
```

### 2. `areas` (Nagpur Zones)
```json
{
  "_id": "ObjectId",
  "name": "Dharampeth",
  "center": {
    "latitude": 21.1428,
    "longitude": 79.0624
  },
  "riskScore": 18,
  "riskLevel": "Low | Moderate | High | Critical",
  "neighbors": ["Sitabuldi", "Ramdaspeth", "Civil Lines", "Laxmi Nagar", "Gokulpeth"],
  "updatedAt": "2026-08-29T22:00:00.000Z"
}
```

### 3. `reports`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId(User)",
  "latitude": 21.1428,
  "longitude": 79.0624,
  "areaId": "ObjectId(Area)",
  "description": "Someone snatched my phone from my hand and fled.",
  "incidentType": "Theft | Robbery | Harassment | Assault | Suspicious Activity | Other",
  "confidence": 0.89,
  "timestamp": "2026-08-29T22:00:00.000Z",
  "status": "active | low_confidence | flagged | archived"
}
```

---

## 4. Authoritative Risk Engine

The backend risk engine (`server/src/services/riskEngine.js`) calculates dynamic risk scores on a scale of `0–100`:

$$ \text{Total Area Risk} = \text{Clamp}_{0}^{100}\left( \text{BaseRisk} + \sum (\text{Severity} \times \text{Confidence} \times \text{TimeDecay}) + \text{FrequencyBonus} \right) $$

- **Severity Weights**:
  - Assault: 25
  - Robbery: 20
  - Harassment: 15
  - Theft: 10
  - Suspicious Activity: 5
  - Other: 5
- **Time Decay**: Half-life decay ($T_{1/2} = 30$ days), ensuring older incidents gradually diminish in weight.
- **Categorical Risk Levels**:
  - `0–25`: Low (Green)
  - `26–50`: Moderate (Amber)
  - `51–75`: High (Orange)
  - `76–100`: Critical (Red)

---

## 5. Machine Learning Classification Pipeline

The Python microservice trains a **TF-IDF bi-gram vectorizer** with **Logistic Regression** on balanced synthetic Nagpur incident descriptions:

- **Classes**: Theft, Robbery, Harassment, Assault, Suspicious Activity, Other.
- **Microservice API**: `POST /predict`
  - Input: `{"description": "Someone brandished a knife and took my cash"}`
  - Output: `{"incidentType": "Robbery", "confidence": 0.91, "isLowConfidence": false}`
- **Low Confidence Threshold**: Configurable threshold (default `0.35`). Ambiguous reports are tagged with `status: 'low_confidence'` in the database.

---

## 6. Setup & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (3.9+) & pip
- MongoDB (running locally on port 27017 or MongoDB Atlas URI)

### Quick Setup

#### 1. ML Microservice Setup
```bash
cd ml
pip install -r requirements.txt
python train.py      # Trains model and serializes to ml/model/
python app.py        # Starts Flask service on http://localhost:5001
```

#### 2. Backend Server Setup
```bash
cd server
npm install
cp .env.example .env
npm run seed         # Seeds 24 Nagpur zones, demo users, and synthetic incidents
npm run dev          # Starts Express API on http://localhost:5000
```

#### 3. Frontend Client Setup
```bash
cd client
npm install
npm run dev          # Starts Vite React application on http://localhost:3000
```

---

## 7. Default Demo Accounts

- **Admin Account**: `admin@safepath.nagpur` / `Admin@12345`
- **Standard User**: `user@safepath.nagpur` / `User@12345`

---

## 8. API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new citizen account | No |
| `POST` | `/api/auth/login` | Sign in & obtain JWT Bearer token | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes |
| `GET` | `/api/areas` | List all 24 Nagpur safety zones & risk scores | No |
| `GET` | `/api/areas/:id` | Get zone metrics & recent incident history | No |
| `GET` | `/api/reports` | Query incident reports with filters | Optional |
| `POST` | `/api/reports` | Submit incident report (triggers ML & risk update) | Yes |
| `PATCH` | `/api/reports/:id/status` | Moderate report status (active, flagged, archived) | Admin |
| `POST` | `/api/navigation` | Analyze corridor safety between Source & Destination | No |
| `GET` | `/api/health` | Health status of API and ML microservice | No |

---

## 9. Running Tests

### Backend Unit & Integration Tests (Jest & Supertest)
```bash
cd server
npm test
```

### ML Pipeline Tests (Pytest)
```bash
cd ml
python -m pytest
```

---

## 10. Architecture Decision Records (ADRs)

- [ADR 001: Maps with Leaflet & OpenStreetMap](file:///C:/Users/Shlok/Desktop/idealab_harness/docs/adr/001-maps-leaflet-openstreetmap.md)
- [ADR 002: Predefined Zone Recommendations vs Turn-by-Turn](file:///C:/Users/Shlok/Desktop/idealab_harness/docs/adr/002-zone-based-recommendations.md)
- [ADR 003: Incident Classification with TF-IDF & Logistic Regression](file:///C:/Users/Shlok/Desktop/idealab_harness/docs/adr/003-ml-incident-classification.md)
- [ADR 004: Authoritative Dynamic Risk Scoring Engine](file:///C:/Users/Shlok/Desktop/idealab_harness/docs/adr/004-risk-scoring.md)

---

## 11. Limitations & Future Scope

### Current Scope & Limitations
- Initial historical incident data is synthetic for demonstration and calibration.
- Navigation recommendations operate at the **predefined zone level** rather than micro-street segments.

### Documented Future Scope
- Official municipal and police department incident dataset integration.
- Street lighting and CCTV density layers.
- Real-time emergency SOS broadcasting.
- Expansion to additional cities beyond Nagpur.
