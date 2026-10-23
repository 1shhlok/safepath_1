const RiskEngine = require('../src/services/riskEngine');
const config = require('../src/config');

describe('SafePath Risk Engine Service (v4.0.0)', () => {
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

  test('applies incident severity weights correctly to accepted reports', () => {
    const assaultReport = {
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'accepted'
    };
    const theftReport = {
      incidentType: 'Theft',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'accepted'
    };

    const assaultScore = RiskEngine.calculateReportContribution(assaultReport);
    const theftScore = RiskEngine.calculateReportContribution(theftReport);

    expect(assaultScore).toBe(config.incidentSeverity.Assault);
    expect(theftScore).toBe(config.incidentSeverity.Theft);
    expect(assaultScore).toBeGreaterThan(theftScore);
  });

  test('enforces zero contribution for pending_review and rejected reports', () => {
    const pendingReport = {
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'pending_review'
    };
    const rejectedReport = {
      incidentType: 'Robbery',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'rejected'
    };
    const archivedReport = {
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'archived'
    };

    expect(RiskEngine.calculateReportContribution(pendingReport)).toBe(0);
    expect(RiskEngine.calculateReportContribution(rejectedReport)).toBe(0);
    expect(RiskEngine.calculateReportContribution(archivedReport)).toBe(0);
  });

  test('calculates deterministic baseline score from historical police station volume', () => {
    // Low crime volume station
    const lowResult = RiskEngine.calculateHistoricalBaselineScore(280);
    expect(lowResult.baselineStatus).toBe('available');
    expect(lowResult.baselineScore).toBe(config.riskParams.baselineMinScore); // 15
    expect(lowResult.reportedCrimes).toBe(280);

    // High crime volume station
    const highResult = RiskEngine.calculateHistoricalBaselineScore(1750);
    expect(highResult.baselineStatus).toBe('available');
    expect(highResult.baselineScore).toBe(config.riskParams.baselineMaxScore); // 60
    expect(highResult.reportedCrimes).toBe(1750);

    // Intermediate station
    const midResult = RiskEngine.calculateHistoricalBaselineScore(1015);
    expect(midResult.baselineStatus).toBe('available');
    expect(midResult.baselineScore).toBeGreaterThan(lowResult.baselineScore);
    expect(midResult.baselineScore).toBeLessThan(highResult.baselineScore);
  });

  test('marks missing historical station data as unavailable, never zero or silent random', () => {
    const nullResult = RiskEngine.calculateHistoricalBaselineScore(null);
    expect(nullResult.baselineStatus).toBe('unavailable');
    expect(nullResult.baselineScore).toBeNull();
    expect(nullResult.reportedCrimes).toBeNull();

    const undefResult = RiskEngine.calculateHistoricalBaselineScore(undefined);
    expect(undefResult.baselineStatus).toBe('unavailable');
    expect(undefResult.baselineScore).toBeNull();
  });

  test('applies time decay so older incidents have lower weight', () => {
    const now = new Date();
    const recentReport = {
      incidentType: 'Robbery',
      confidence: 0.9,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'accepted'
    };
    const oldReport = {
      incidentType: 'Robbery',
      confidence: 0.9,
      timestamp: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      status: 'accepted'
    };

    const recentWeight = RiskEngine.calculateReportContribution(recentReport, now);
    const oldWeight = RiskEngine.calculateReportContribution(oldReport, now);

    expect(recentWeight).toBeGreaterThan(oldWeight);
    expect(oldWeight).toBeLessThan(recentWeight * 0.35);
  });

  test('calculates area risk combining historical baseline and accepted reports with full explanation', () => {
    const historicalBaseline = {
      reportedCrimes: 818,
      baselineRisk: 35
    };

    const reports = [
      { incidentType: 'Assault', confidence: 0.9, timestamp: new Date(), status: 'accepted' },
      { incidentType: 'Robbery', confidence: 0.85, timestamp: new Date(), status: 'pending_review' }, // Ignored!
      { incidentType: 'Theft', confidence: 0.9, timestamp: new Date(), status: 'rejected' }          // Ignored!
    ];

    const result = RiskEngine.calculateAreaRisk(reports, historicalBaseline);

    expect(result.baselineStatus).toBe('available');
    expect(result.historicalBaselineScore).toBe(35);
    expect(result.acceptedReportCount).toBe(1);
    expect(result.incidentCount).toBe(3);
    // Baseline (35) + Assault (25 * 0.9 = 22.5) + frequency bonus (2) ~ 35 + 25 = 60
    expect(result.riskScore).toBeGreaterThan(35);
    expect(result.riskScore).toBeLessThanOrEqual(100);

    // Verify explanation object
    expect(result.explanation).toBeDefined();
    expect(result.explanation.formulaVersion).toBe('4.0.0');
    expect(result.explanation.historicalBaselineScore).toBe(35);
    expect(result.explanation.acceptedCommunityReportsCount).toBe(1);
    expect(result.explanation.disclaimer).toContain('recorded police case volume');
  });

  test('bounds area risk scores strictly between 0 and 100', () => {
    // Massive flood of violent incidents
    const massiveReports = Array(50).fill(null).map(() => ({
      incidentType: 'Assault',
      confidence: 1.0,
      timestamp: new Date(),
      status: 'accepted'
    }));

    const highResult = RiskEngine.calculateAreaRisk(massiveReports, 1750);
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
