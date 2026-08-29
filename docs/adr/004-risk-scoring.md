# ADR 004: Authoritative Dynamic Risk Scoring Engine

## Context
Safety risk calculation must be consistent, deterministic, centralized, and resistant to frontend tampering. Risk calculations must consider incident severity, confidence of classification, time decay (recency), and incident cluster frequency.

## Decision
We implemented a centralized, authoritative Risk Engine in `server/src/services/riskEngine.js`. Frontend components consume precalculated backend risk scores and do not perform independent risk calculations.

## Formula
For each incident report in an area:
$$ \text{Severity} \in \{5, 10, 15, 20, 25\} $$
$$ \text{Confidence} \in [0.0, 1.0] $$
$$ \text{TimeDecay} = 2^{-\frac{\Delta \text{Days}}{30}} $$
$$ \text{ReportContribution} = \text{Severity} \times \text{Confidence} \times \text{TimeDecay} $$

$$ \text{Total Area Risk} = \text{Clamp}_{0}^{100}\left( \text{BaseRisk} + \sum \text{ReportContributions} + \text{FrequencyBonus} \right) $$

## Categorical Risk Levels
- 0–25: Low (Green)
- 26–50: Moderate (Amber)
- 51–75: High (Orange)
- 76–100: Critical (Red)

## Alternatives Considered
- Static manual risk ratings: Fails to adapt to new user reports or decay over time.
- Frontend calculated risk: Introduces data divergence across platforms and clients.

## Consequences
- Every new report automatically updates the zone's risk score and level in MongoDB.
- Seed data runs the risk engine dynamically across historical incidents during initialization.
