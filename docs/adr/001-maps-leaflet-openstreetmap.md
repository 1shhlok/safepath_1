# ADR 001: Maps Implementation with Leaflet and OpenStreetMap

## Context
SafePath requires an interactive, performant mapping visualization for the city of Nagpur, Maharashtra, to display urban safety zones, risk heatmaps, and zone-level journey recommendations without vendor lock-in or recurring API costs.

## Decision
We chose Leaflet combined with OpenStreetMap tile layers and React-Leaflet over Google Maps SDK or Mapbox.

## Alternatives Considered
- Google Maps JavaScript API: Proprietary, requires billing setup and API keys, encourages turn-by-turn road navigation which violates the SafePath product contract.
- Mapbox GL JS: High rendering complexity and proprietary token requirements.

## Reason
- Open source, privacy-respecting, and free from restrictive API quotas.
- Flexible CircleMarker and polygon rendering for zone-level risk heatmaps.
- Enforces the product contract: SafePath does not provide turn-by-turn navigation routes or road-level polyline routing.

## Consequences
- Routing tiles and geocoding rely on OpenStreetMap Nominatim and predefined zone centroids.
- In-memory geocode caching is implemented to adhere to Nominatim usage policies.
