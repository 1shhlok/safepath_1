const ZoneRecommendationService = require('../src/services/zoneRecommendationService');
const nagpurZones = require('../src/seed/nagpurZones');

describe('SafePath Navigation & Zone Recommendation Service', () => {
  const mockAreas = nagpurZones.map(z => ({
    ...z,
    riskScore: z.name === 'Civil Lines' ? 12 : z.name === 'Itwari' ? 82 : z.name === 'Mahal' ? 65 : 25,
    riskLevel: z.name === 'Civil Lines' ? 'Low' : z.name === 'Itwari' ? 'Critical' : z.name === 'Mahal' ? 'High' : 'Low'
  }));

  test('resolves source and destination to nearest Nagpur zones and produces zone-level recommendations', async () => {
    const result = await ZoneRecommendationService.analyzeJourney(
      'Dharampeth',
      'Mahal',
      mockAreas
    );

    expect(result).toBeDefined();
    expect(result.sourceZone).toBe('Dharampeth');
    expect(result.destinationZone).toBe('Mahal');
    expect(result.overallRisk).toBeGreaterThanOrEqual(0);
    expect(result.overallRisk).toBeLessThanOrEqual(100);
    expect(['Low', 'Moderate', 'High', 'Critical']).toContain(result.riskLevel);
    
    // Check recommendations array
    expect(Array.isArray(result.recommendedAreas)).toBe(true);
    expect(Array.isArray(result.avoidAreas)).toBe(true);
    expect(Array.isArray(result.corridorZones)).toBe(true);

    // Safer areas have lower scores than avoid areas
    if (result.recommendedAreas.length > 0 && result.avoidAreas.length > 0) {
      const topSafe = result.recommendedAreas[0].riskScore;
      const topAvoid = result.avoidAreas[0].riskScore;
      expect(topSafe).toBeLessThanOrEqual(topAvoid);
    }

    // Must NOT contain road coordinates or blue route geometry
    expect(result.routeCoordinates).toBeUndefined();
    expect(result.turnByTurn).toBeUndefined();
    expect(result.steps).toBeUndefined();
    expect(result.disclaimer).toContain('SafePath provides zone-level safety decision support');
  });

  test('handles identical source and destination safely', async () => {
    const result = await ZoneRecommendationService.analyzeJourney(
      'Civil Lines',
      'Civil Lines',
      mockAreas
    );

    expect(result.sourceZone).toBe('Civil Lines');
    expect(result.destinationZone).toBe('Civil Lines');
    expect(result.corridorZones.length).toBeGreaterThanOrEqual(1);
  });
});
