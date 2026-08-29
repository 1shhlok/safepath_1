const RiskEngine = require('../src/services/riskEngine');
const config = require('../src/config');

describe('SafePath Risk Engine Service', () => {
  test('correctly maps numerical scores to categorical risk levels', () => {
    expect(RiskEngine.getRiskLevel(0)).toBe('Low');
    expect(RiskEngine.getRiskLevel(25)).toBe('Low');
    expect(RiskEngine.getRiskLevel(26)).toBe('Moderate');
    expect(RiskEngine.getRiskLevel(50)).toBe('Moderate');
    expect(RiskEngine.getRiskLevel(51)).toBe('High');
    expect(RiskEngine.getRiskLevel(75)).toBe('High');
    expect(RiskEngine.getRiskLevel(76)).toBe('Critical');
    expect(RiskEngine.getRiskLevel(100)).toBe('Critical');
  });

  test('applies incident severity weights correctly', () => {
    const assaultReport = {
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date()
    };
    const theftReport = {
      incidentType: 'Theft',
      confidence: 1.0,
      timestamp: new Date()
    };

    const assaultScore = RiskEngine.calculateReportContribution(assaultReport);
    const theftScore = RiskEngine.calculateReportContribution(theftReport);

    expect(assaultScore).toBe(config.incidentSeverity.Assault);
    expect(theftScore).toBe(config.incidentSeverity.Theft);
    expect(assaultScore).toBeGreaterThan(theftScore);
  });

  test('applies time decay so older incidents have lower weight', () => {
    const now = new Date();
    const recentReport = {
      incidentType: 'Robbery',
      confidence: 0.9,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    };
    const oldReport = {
      incidentType: 'Robbery',
      confidence: 0.9,
      timestamp: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
    };

    const recentWeight = RiskEngine.calculateReportContribution(recentReport, now);
    const oldWeight = RiskEngine.calculateReportContribution(oldReport, now);

    expect(recentWeight).toBeGreaterThan(oldWeight);
    // After 60 days (2 half-lives of 30 days), weight should be approx 25% of recent
    expect(oldWeight).toBeLessThan(recentWeight * 0.35);
  });

  test('bounds area risk scores strictly between 0 and 100', () => {
    // Zero reports
    const emptyResult = RiskEngine.calculateAreaRisk([]);
    expect(emptyResult.riskScore).toBe(config.riskParams.baseZoneRisk);
    expect(emptyResult.riskLevel).toBe('Low');

    // Massive flood of violent incidents
    const massiveReports = Array(50).fill(null).map(() => ({
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'active'
    }));

    const highResult = RiskEngine.calculateAreaRisk(massiveReports);
    expect(highResult.riskScore).toBeLessThanOrEqual(100);
    expect(highResult.riskScore).toBeGreaterThanOrEqual(76);
    expect(highResult.riskLevel).toBe('Critical');
  });

  test('calculates journey risk weighting average and peak hotspots', () => {
    const zones = [
      { name: 'Civil Lines', riskScore: 15 },
      { name: 'Dharampeth', riskScore: 20 },
      { name: 'Itwari', riskScore: 85 }
    ];

    const result = RiskEngine.calculateJourneyRisk(zones);
    expect(result.overallRisk).toBeGreaterThan(20);
    expect(result.maxZoneRisk).toBe(85);
    expect(result.riskLevel).toBeDefined();
  });
});
