const GeocodingService = require('./geocodingService');
const RiskEngine = require('./riskEngine');

/**
 * Predefined Zone Recommendation Engine
 * 
 * Complies strictly with SAFEPath Harness Contract:
 * - NO Dijkstra
 * - NO A*
 * - NO Road networks
 * - NO Turn-by-turn navigation or road coordinates
 * 
 * Analyzes zone-level graph adjacency to identify corridor zones between source and destination,
 * evaluates zone risk scores, and categorizes zones into Follow (safer alternatives) and Avoid (high-risk areas).
 */
class ZoneRecommendationService {
  /**
   * Find candidate corridor zone paths in the zone adjacency graph using BFS
   */
  static findZoneCorridors(sourceName, destName, zoneMap) {
    if (sourceName === destName) {
      return [[sourceName]];
    }

    const queue = [[sourceName]];
    const visited = new Set([sourceName]);
    const validPaths = [];

    // Find zone paths up to 5 zone hops
    while (queue.length > 0 && validPaths.length < 5) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === destName) {
        validPaths.push(path);
        continue;
      }

      if (path.length >= 6) continue; // limit depth

      const zoneObj = zoneMap.get(current);
      if (!zoneObj || !zoneObj.neighbors) continue;

      for (const neighbor of zoneObj.neighbors) {
        if (!path.includes(neighbor)) {
          queue.push([...path, neighbor]);
        }
      }
    }

    // Fallback: If disconnected or direct search yields few, return source, dest, and their direct neighbors
    if (validPaths.length === 0) {
      const srcObj = zoneMap.get(sourceName);
      const dstObj = zoneMap.get(destName);
      const intermediate = [];
      if (srcObj?.neighbors) intermediate.push(...srcObj.neighbors);
      if (dstObj?.neighbors) intermediate.push(...dstObj.neighbors);
      return [[sourceName, ...Array.from(new Set(intermediate)), destName]];
    }

    return validPaths;
  }

  /**
   * Analyze journey between two locations
   * @param {string} sourceQuery 
   * @param {string} destQuery 
   * @param {Array} allAreasFromDb 
   */
  static async analyzeJourney(sourceQuery, destQuery, allAreasFromDb) {
    // 1. Geocode both locations
    const sourceGeocode = await GeocodingService.geocode(sourceQuery);
    const destGeocode = await GeocodingService.geocode(destQuery);

    // 2. Identify nearest predefined Nagpur zones
    const sourceNearest = GeocodingService.findNearestZone(
      sourceGeocode.latitude,
      sourceGeocode.longitude,
      allAreasFromDb
    );

    const destNearest = GeocodingService.findNearestZone(
      destGeocode.latitude,
      destGeocode.longitude,
      allAreasFromDb
    );

    const sourceZone = sourceNearest.zone;
    const destZone = destNearest.zone;

    // Create lookup map
    const zoneMap = new Map();
    for (const area of allAreasFromDb) {
      zoneMap.set(area.name, area);
    }

    // 3. Find relevant connected corridor zones using zone relationship graph
    const paths = this.findZoneCorridors(sourceZone.name, destZone.name, zoneMap);
    
    // Collect all candidate zones involved in paths or neighboring corridors
    const candidateZoneNames = new Set();
    paths.forEach(p => p.forEach(name => candidateZoneNames.add(name)));

    // Include immediate neighbors of source and dest to evaluate alternative corridors
    if (sourceZone.neighbors) sourceZone.neighbors.forEach(n => candidateZoneNames.add(n));
    if (destZone.neighbors) destZone.neighbors.forEach(n => candidateZoneNames.add(n));

    const corridorZones = Array.from(candidateZoneNames)
      .map(name => zoneMap.get(name))
      .filter(Boolean);

    // 4. Evaluate zone risks & partition into Follow (safer) and Avoid (high risk)
    // Calculate median/average corridor risk as reference
    const sortedByRisk = [...corridorZones].sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0));
    
    // Recommended areas: lower risk scores (score <= 45 or bottom 40% safest)
    const recommendedAreas = sortedByRisk
      .filter(z => (z.riskScore || 0) <= 45)
      .map(z => ({
        name: z.name,
        riskScore: z.riskScore,
        riskLevel: z.riskLevel,
        center: z.center
      }));

    // Avoid areas: elevated or high risk scores (score >= 50)
    const avoidAreas = sortedByRisk
      .filter(z => (z.riskScore || 0) >= 50)
      .map(z => ({
        name: z.name,
        riskScore: z.riskScore,
        riskLevel: z.riskLevel,
        center: z.center
      }));

    // Calculate journey risk summary
    const journeyEvaluation = RiskEngine.calculateJourneyRisk(corridorZones);

    // 5. Generate human-readable reasoning based on SafePath data
    let reasoning = "";
    if (avoidAreas.length > 0 && recommendedAreas.length > 0) {
      const topFollow = recommendedAreas.slice(0, 2).map(a => a.name).join(' and ');
      const topAvoid = avoidAreas.slice(-2).map(a => a.name).join(' and ');
      reasoning = `Based on available SafePath incident records, transiting via ${topFollow} presents relatively lower recorded risk (${recommendedAreas[0].riskLevel} risk). In contrast, ${topAvoid} currently shows higher incident density or severity (${avoidAreas[avoidAreas.length - 1].riskLevel} risk).`;
    } else if (avoidAreas.length === 0) {
      reasoning = `All intermediate zones along this corridor currently demonstrate relatively low to moderate recorded risk scores based on SafePath data.`;
    } else {
      reasoning = `Higher incident activity has been reported across several corridor zones. Exercise standard urban precautions.`;
    }

    return {
      source: {
        query: sourceQuery,
        resolvedZone: sourceZone.name,
        coordinates: sourceZone.center
      },
      destination: {
        query: destQuery,
        resolvedZone: destZone.name,
        coordinates: destZone.center
      },
      sourceZone: sourceZone.name,
      destinationZone: destZone.name,
      overallRisk: journeyEvaluation.overallRisk,
      riskLevel: journeyEvaluation.riskLevel,
      recommendedAreas,
      avoidAreas,
      corridorZones: corridorZones.map(z => ({
        name: z.name,
        riskScore: z.riskScore,
        riskLevel: z.riskLevel,
        center: z.center
      })),
      reasoning,
      disclaimer: "SafePath provides zone-level safety decision support based on available community and synthetic data. It does not provide turn-by-turn navigation or guarantee personal safety."
    };
  }
}

module.exports = ZoneRecommendationService;
