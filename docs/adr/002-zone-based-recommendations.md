# ADR 002: Predefined Zone Recommendations vs Turn-by-Turn Navigation

## Context
Conventional navigation systems attempt turn-by-turn routing using road graphs and graph algorithms like Dijkstra or A*. However, SafePath is specifically engineered as a context-aware safety decision-support tool rather than a turn-by-turn GPS replacement.

## Decision
SafePath models Nagpur as 24 predefined urban zones with an adjacency relationship graph. When analyzing a journey between a source and destination, SafePath resolves candidate corridor zones, evaluates authoritative risk metrics, and classifies zones into "Areas to Follow" (safer alternatives) and "Areas to Avoid" (elevated risk hotspots).

## Alternatives Considered
- Dijkstra / A* over OpenStreetMap road networks: Generates false impressions of exact road safety guarantees, exposes users to unverified fine-grained routing paths, and violates the product specification.
- Direct linear distance interpolation: Ignores urban neighborhood layout and connectivity.

## Reason
- Zone-level decision support allows citizens to make informed macro-routing choices.
- Prevents misleading safety claims on individual street segments where micro-data is unavailable.
- Clear separation between transit corridors and high-risk avoidance areas.

## Consequences
- The UI strictly presents zone-level safety cards and heatmap circles rather than drawing blue street routes.
- Clear disclaimers communicate that SafePath provides decision support rather than personal safety guarantees.
