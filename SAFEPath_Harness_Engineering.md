# SafePath — Harness Engineering Guide

## Purpose

This document defines the engineering harness for building SafePath with AI coding agents such as Antigravity.

The goal is to make development:
- predictable
- testable
- incremental
- easy to review
- resistant to regressions
- consistent with the approved project scope

The AI agent must treat this document as an engineering contract.

---

# 1. Product Contract

SafePath is a context-aware urban safety decision-support application for Nagpur.

The user enters:

- Source
- Destination

SafePath does **not** provide conventional road navigation.

It must not:
- draw a blue route
- provide turn-by-turn directions
- use Dijkstra
- use A*
- construct a detailed road graph

Instead, SafePath:

1. Geocodes source and destination.
2. Maps them to predefined Nagpur zones.
3. Determines relevant connected zones using the predefined zone graph.
4. evaluates zone risk.
5. returns areas to follow and areas to avoid.
6. displays the safety heatmap.

---

# 2. Technology Contract

Primary stack:

- React
- Node.js
- Express
- MongoDB
- Mongoose
- JavaScript ES6+
- Tailwind CSS
- Leaflet
- React-Leaflet
- OpenStreetMap
- Axios
- JWT
- bcrypt

ML:

- Python
- Pandas
- NumPy
- scikit-learn
- TF-IDF
- Logistic Regression

The Python ML service is responsible for incident-type classification.

---

# 3. Repository Rules

Keep the repository organized as:

```text
safepath/
├── client/
├── server/
├── ml/
├── docs/
└── README.md
```

Do not put unrelated files in the repository root.

Do not commit:
- `.env`
- secrets
- passwords
- generated credentials
- large model artifacts unless explicitly required

Provide `.env.example`.

---

# 4. Source of Truth

Before modifying code, inspect:

1. `README.md`
2. `docs/`
3. relevant source files
4. tests
5. configuration files

Do not assume that previous AI-generated code is correct.

If implementation and documentation disagree:

- determine which behavior is currently approved
- preserve the product contract in this document
- update documentation when implementation changes intentionally

Do not silently change core architecture.

---

# 5. Change Policy

Every change must have a clear purpose.

Before coding, identify:

```text
Goal
Files likely affected
Expected behavior
Tests required
```

Prefer small changes.

Do not rewrite unrelated files.

Do not perform broad refactors while implementing a feature unless the refactor is necessary.

Avoid speculative abstractions.

Prefer the simplest implementation that satisfies the requirement.

---

# 6. Definition of Done

A task is not complete merely because code was generated.

A task is complete only when:

- implementation exists
- relevant tests exist or are updated
- tests pass
- lint/build checks pass where configured
- error handling is present
- documentation is updated if behavior changed
- no unrelated regressions were introduced

The agent must report what was changed and what was tested.

---

# 7. Development Loop

For every task:

```text
Understand
    ↓
Inspect existing code
    ↓
Plan smallest change
    ↓
Implement
    ↓
Run tests
    ↓
Run lint/build
    ↓
Inspect failures
    ↓
Fix
    ↓
Re-run validation
    ↓
Document
```

Never stop immediately after writing code.

---

# 8. Tests

Use automated tests for important backend and ML behavior.

At minimum test:

## Authentication

- successful signup
- duplicate email
- successful login
- invalid credentials
- protected endpoint without token

## Reports

- authenticated report submission
- missing description
- invalid coordinates
- ML classification response
- low-confidence classification handling

## Risk Engine

- incident severity is applied
- recent incidents increase risk
- time factor works
- score remains between 0 and 100
- correct risk level is generated

## Navigation

- source zone is resolved
- destination zone is resolved
- relevant zones are returned
- safer zones appear in Follow
- higher-risk zones appear in Avoid
- no route coordinates are generated

## ML

Test representative descriptions for:
- Theft
- Robbery
- Harassment
- Assault
- Suspicious Activity
- Other

Do not assert unrealistic exact confidence values unless the model is deterministic and versioned.

---

# 9. Validation Commands

The repository should provide simple commands for:

```bash
npm run dev
npm run test
npm run lint
npm run build
```

For the ML service, provide equivalent documented commands.

If a command does not exist, create it when practical.

Do not claim a command works without actually testing it.

---

# 10. Backend Architecture

Use:

```text
routes
  ↓
controllers
  ↓
services
  ↓
models
```

Keep business logic out of route definitions where practical.

Important services should include:

- risk scoring
- zone recommendation
- geocoding
- ML service communication

Controllers should coordinate requests rather than contain large blocks of business logic.

---

# 11. Database Contract

Primary collections:

```text
users
reports
areas
```

## User

```js
{
  name,
  email,
  password,
  role,
  createdAt
}
```

Roles:

```text
user
admin
```

Passwords must be hashed using bcrypt.

---

## Report

```js
{
  userId,
  latitude,
  longitude,
  areaId,
  description,
  incidentType,
  confidence,
  timestamp,
  status
}
```

`timestamp` must be generated by the server.

Incident type is produced by the ML classification service.

---

## Area

```js
{
  name,
  center: {
    latitude,
    longitude
  },
  riskScore,
  riskLevel,
  neighbors,
  updatedAt
}
```

---

# 12. Data Integrity

Validate all incoming data.

Examples:

- latitude must be valid
- longitude must be valid
- description must not be empty
- incident type must be one of the supported categories
- confidence must be between 0 and 1
- risk score must be between 0 and 100

Never trust frontend validation alone.

Repeat important validation on the server.

---

# 13. Risk Engine Contract

Risk score:

```text
Base Risk
+ Incident Severity
+ Time Factor
+ Recent Incident Frequency
```

Final score:

```text
0–100
```

Risk levels:

```text
0–25     Low
26–50    Moderate
51–75    High
76–100   Critical
```

Initial incident severity:

```text
Suspicious Activity = 5
Theft               = 10
Harassment          = 15
Robbery             = 20
Assault             = 25
Other               = 5
```

Keep these values in a central configuration module.

Do not scatter magic numbers throughout the application.

Use time decay so old reports gradually have less influence.

The exact formula must be deterministic and documented.

---

# 14. ML Contract

The ML system performs:

```text
Incident Description
        ↓
TF-IDF
        ↓
Logistic Regression
        ↓
Incident Type
        ↓
Confidence
```

Supported categories:

```text
Theft
Robbery
Harassment
Assault
Suspicious Activity
Other
```

The ML system does **not** verify whether a crime actually happened.

It only classifies the description.

Never describe the classifier as a police verification system.

---

# 15. ML Service Contract

Expose:

```http
POST /predict
```

Input:

```json
{
  "description": "Someone threatened me and took my phone"
}
```

Output:

```json
{
  "incidentType": "Robbery",
  "confidence": 0.91
}
```

The response must be validated by the Node backend before being stored.

If the ML service is unavailable:

- return a controlled error
- do not crash the backend
- do not silently fabricate a prediction

---

# 16. ML Training Harness

Training data must be stored separately from application code.

Example:

```text
ml/
├── data/
│   └── incident_training.csv
├── train.py
├── app.py
├── evaluate.py
└── model/
```

The training pipeline must:

1. load the dataset
2. validate labels
3. split training/test data
4. fit TF-IDF
5. fit Logistic Regression
6. calculate evaluation metrics
7. save the model
8. save the vectorizer

Track:

- accuracy
- precision
- recall
- F1 score
- confusion matrix where practical

Do not fabricate metrics.

---

# 17. ML Dataset Rules

Initial training data is synthetic.

Clearly label it as synthetic/demo data.

Avoid duplicate or near-duplicate examples across train and test sets.

Keep class distribution reasonably balanced.

Include realistic wording variation.

Do not use obvious keyword-only examples for every class.

The model should learn from descriptions rather than a manually coded keyword list.

---

# 18. Low Confidence Handling

Confidence must be configurable.

Example policy:

```text
confidence >= threshold
    → accept predicted category

confidence < threshold
    → mark as low-confidence
```

Low-confidence reports must not be treated as certain classifications.

The UI should communicate this clearly.

---

# 19. Zone Recommendation Contract

SafePath uses predefined zones.

It does not use:

- Dijkstra
- A*
- road graphs
- turn-by-turn routing

Process:

```text
Source
  ↓
Geocode
  ↓
Nearest Zone

Destination
  ↓
Geocode
  ↓
Nearest Zone

Source Zone + Destination Zone
  ↓
Predefined Zone Relationships
  ↓
Relevant Zones
  ↓
Risk Evaluation
  ↓
Follow / Avoid
```

The recommendation engine must not return fake road routes.

---

# 20. Geographic Data

Use approximately 20–30 predefined Nagpur zones.

Each zone should have:

- name
- center coordinates
- neighbors
- risk score
- risk level

All initial risk values are project/demo values unless sourced from a documented real dataset.

Do not fabricate claims that specific crimes occurred in specific areas.

---

# 21. Frontend Contract

Home page:

```text
SafePath
Source
Destination
Analyze Safe Journey
Map
Heatmap
Legend
Results
```

Results:

```text
Overall Safety
Risk Score

Areas to Follow

Areas to Avoid

Reasoning
```

Report page:

```text
Location
Incident Description
Submit Report
```

After submission show:

```text
AI Classification
Confidence
Affected Area
Risk Contribution
```

Include a clear disclaimer that AI classification does not verify the incident.

---

# 22. Map Contract

Use:

- Leaflet
- OpenStreetMap

The map must:

- center on Nagpur initially
- show risk visualization
- show a legend
- allow zoom/pan
- allow zone inspection

High-risk zones must visually appear more red/intense.

Do not draw a navigation route.

Do not imply that the map represents official police crime density unless it actually does.

---

# 23. API Contract

Required APIs:

```http
POST /api/auth/signup
POST /api/auth/login

GET /api/areas
GET /api/reports

POST /api/reports

POST /api/navigation

GET /api/health
```

Add endpoints only when necessary.

Protect authenticated endpoints.

Protect admin functionality using role-based authorization.

---

# 24. Security Harness

Check:

- passwords are hashed
- JWT secrets come from environment variables
- authentication middleware is applied
- authorization checks roles
- request bodies are validated
- MongoDB queries are safely constructed
- CORS is intentionally configured
- sensitive data is not returned
- stack traces are not exposed to users

Never log:
- passwords
- JWT secrets
- database credentials

---

# 25. Observability

Provide useful server-side logs for:

- startup
- database connection
- ML service availability
- API errors
- important processing failures

Logs must not contain sensitive user information unnecessarily.

Use consistent error responses.

Example:

```json
{
  "error": "Unable to classify incident description"
}
```

Do not expose internal stack traces in production responses.

---

# 26. Error Boundaries

Frontend failures should not blank the entire application.

Implement appropriate error handling for:

- failed API requests
- failed geocoding
- failed ML prediction
- unavailable backend
- invalid search locations

Show useful messages such as:

> "We couldn't determine that location. Try a more specific place name."

---

# 27. Seed Data Harness

Provide a repeatable seed command.

Example:

```bash
npm run seed
```

The seed process should:

1. clear/reinitialize development collections when explicitly requested
2. create zones
3. create synthetic incident records
4. calculate initial risk
5. create development admin if required

Never make destructive database resets happen automatically during normal application startup.

---

# 28. Configuration

Centralize configuration.

Examples:

```text
risk weights
confidence threshold
risk thresholds
ML service URL
geocoding settings
```

Do not hard-code environment-specific values throughout the code.

---

# 29. Dependency Discipline

Before adding a package:

1. Check whether the functionality already exists.
2. Prefer existing dependencies.
3. Add a new package only when justified.
4. Keep dependencies minimal.

After adding dependencies:

- update lockfile
- run tests
- run build
- check for obvious vulnerabilities when tooling is available

---

# 30. No Fake Functionality

Do not create:

- buttons that do nothing
- fake API responses in production code
- hard-coded navigation results pretending to be calculated
- fake ML predictions
- fake database success messages

Mocks are allowed only for:
- seed data
- tests
- explicitly documented development fixtures

---

# 31. UI Data Integrity

The frontend must display values received from the backend.

Do not independently calculate critical risk values in multiple places.

Risk scoring should have one authoritative implementation on the backend.

---

# 32. API/Schema Compatibility

Whenever changing:

- MongoDB schemas
- API request format
- API response format
- ML response format

search the repository for all consumers before modifying the contract.

Update:

- backend
- frontend
- tests
- documentation

together.

---

# 33. Regression Prevention

Before completing a task:

```text
Run targeted tests
        ↓
Run full test suite
        ↓
Run lint
        ↓
Run build
```

If something fails:

- identify the root cause
- fix it
- rerun validation

Do not simply suppress the failing test.

Do not delete tests to make the suite pass.

---

# 34. Git Discipline

Prefer small, logically grouped commits.

Commit messages should describe the actual change.

Examples:

```text
feat: add incident classification service
feat: add Nagpur zone seed data
feat: add safety heatmap
fix: handle low-confidence incident predictions
test: add risk engine tests
```

Do not mix unrelated features into one commit.

---

# 35. Documentation Discipline

When behavior changes, update documentation in the same task.

README should explain:

- setup
- environment variables
- running frontend
- running backend
- running ML service
- training model
- seeding database
- API endpoints
- architecture
- limitations

Do not document features that are not implemented.

---

# 36. Architecture Decision Records

For significant architectural decisions, create short ADRs in:

```text
docs/adr/
```

Recommended ADRs:

```text
001-maps-leaflet-openstreetmap.md
002-zone-based-recommendations.md
003-ml-incident-classification.md
004-risk-scoring.md
```

Each ADR should contain:

```text
Context
Decision
Alternatives considered
Reason
Consequences
```

Keep ADRs short.

---

# 37. Agent Working Rules

When working as an AI coding agent:

1. Inspect before editing.
2. Never assume files exist.
3. Never invent APIs.
4. Never invent environment variables.
5. Never silently change the architecture.
6. Never overwrite working code unnecessarily.
7. Prefer incremental changes.
8. Test every meaningful change.
9. Fix errors before moving on.
10. State uncertainties explicitly.
11. Preserve existing working behavior unless the task requires changing it.
12. If a requirement is ambiguous, inspect project documentation and existing code before making a decision.

---

# 38. Task Completion Report

At the end of every implementation task, report:

```text
Implemented:
- ...

Files changed:
- ...

Tests run:
- ...

Build/lint:
- ...

Known limitations:
- ...
```

Keep this concise.

Never claim validation that was not actually performed.

---

# 39. Priority Order

When requirements conflict, use this priority:

1. Security
2. Data correctness
3. Product contract
4. Existing tests
5. Maintainability
6. Performance
7. UI polish
8. Convenience

Do not sacrifice correctness for speed.

---

# 40. Final Product Constraints

The following are non-negotiable:

- SafePath
- Nagpur first
- MERN primary stack
- Leaflet + OpenStreetMap
- predefined zones
- mock/synthetic initial data
- real user reports
- login required for reporting
- no photo uploads
- TF-IDF + Logistic Regression
- six incident categories
- confidence score
- configurable severity weights
- dynamic risk scoring
- heatmap
- Follow areas
- Avoid areas
- no Dijkstra
- no A*
- no road network
- no turn-by-turn navigation
- no fake crime verification
- no fabricated real crime statistics
- no safety guarantees

The system must remain a **decision-support platform based on available SafePath data**, not a police verification service and not a conventional navigation replacement.
