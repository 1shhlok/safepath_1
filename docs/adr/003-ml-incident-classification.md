# ADR 003: Natural Language Incident Classification with TF-IDF & Logistic Regression

## Context
When citizens submit safety reports, asking them to categorize legal/criminal definitions manually creates friction and inconsistent labeling. SafePath requires an automated natural language classifier to categorize plain text reports into one of six standardized categories (Theft, Robbery, Harassment, Assault, Suspicious Activity, Other).

## Decision
We implemented a dedicated Python microservice utilizing a TF-IDF bi-gram vectorizer paired with a multinomial Logistic Regression classifier with balanced class weights.

## Alternatives Considered
- Static keyword matching / regex rules: Fragile, brittle, and incapable of generalizing to linguistic variations or subtle contextual cues.
- Large Language Model (LLM) API calls: High cost per query, latency overhead, dependency on cloud connectivity, non-deterministic probability calibration.
- Deep Learning (BERT/Transformers): High resource footprint for simple classification tasks and requires GPU infrastructure.

## Reason
- Fast inference (<15ms per request) and small memory footprint (<50MB).
- Deterministic, calibrated confidence scores allowing explicit low-confidence flagging.
- Easy to retrain and evaluate with scikit-learn standard pipelines.

## Consequences
- The Node.js backend communicates with the Python microservice over HTTP (`POST /predict`).
- Resilient error handling ensures backend availability even if the ML service is temporarily down.
- Clear disclaimers communicate that the classifier analyzes text descriptions without verifying if the reported incident occurred.
