const config = require('../config');

/**
 * Authoritative Risk Engine Service for SafePath
 * 
 * Formula:
 * For each incident in an area:
 *   Severity = Configured Incident Severity (5 to 25)
 *   Confidence = ML Confidence Factor (0.0 to 1.0)
 *   DaysElapsed = (CurrentTime - IncidentTime) in days
 *   TimeDecay = 2 ^ (-DaysElapsed / TimeDecayHalfLife)  [Half-life = 30 days]
 *   IncidentContribution = Severity * Confidence * TimeDecay
 * 
 * Total Risk Score = Base Risk + Sum(IncidentContributions) + FrequencyBonus
 * Clamped strictly to [0, 100]
 */

class RiskEngine {
  /**
   * Determine categorical risk level from numerical score [0, 100]
   */
  static getRiskLevel(score) {
    const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
    const levels = config.riskLevels;

    if (clampedScore <= levels.LOW.max) {
      return levels.LOW.label;
    } else if (clampedScore <= levels.MODERATE.max) {
      return levels.MODERATE.label;
    } else if (clampedScore <= levels.HIGH.max) {
      return levels.HIGH.label;
    } else {
      return levels.CRITICAL.label;
    }
  }

  /**
   * Calculate risk contribution of an individual report
   */
  static calculateReportContribution(report, referenceDate = new Date()) {
    if (!report || !report.incidentType) return 0;

    const severity = config.incidentSeverity[report.incidentType] || config.incidentSeverity.Other;
    const confidence = typeof report.confidence === 'number' ? Math.max(0, Math.min(1, report.confidence)) : 0.5;

    const reportDate = report.timestamp ? new Date(report.timestamp) : new Date();
    const daysElapsed = Math.max(0, (referenceDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Half-life decay: weight = 2^(-days / halfLifeDays)
    const halfLife = config.riskParams.timeDecayHalfLifeDays || 30;
    const timeDecay = Math.pow(2, -daysElapsed / halfLife);

    return severity * confidence * timeDecay;
  }

  /**
   * Calculate aggregated risk score and level for an area based on its reports
   */
  static calculateAreaRisk(reports = [], baseRisk = config.riskParams.baseZoneRisk, referenceDate = new Date()) {
    let incidentSum = 0;
    let recentIncidentCount = 0;
    const windowDays = config.riskParams.recentIncidentWindowDays || 60;

    for (const report of reports) {
      // Ignore archived or deleted reports
      if (report.status === 'archived') continue;

      const contribution = this.calculateReportContribution(report, referenceDate);
      incidentSum += contribution;

      const reportDate = report.timestamp ? new Date(report.timestamp) : new Date();
      const daysElapsed = (referenceDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysElapsed <= windowDays) {
        recentIncidentCount++;
      }
    }

    // Frequency bonus for active incident clusters: +2 points per recent incident (capped at 15)
    const frequencyBonus = Math.min(15, recentIncidentCount * 2);

    const rawScore = baseRisk + incidentSum + frequencyBonus;
    const clampedScore = Math.round(Math.max(config.riskParams.minScore, Math.min(config.riskParams.maxScore, rawScore)));
    const riskLevel = this.getRiskLevel(clampedScore);

    return {
      riskScore: clampedScore,
      riskLevel,
      incidentCount: reports.length,
      recentIncidentCount
    };
  }

  /**
   * Calculate overall journey safety from a sequence of zones
   */
  static calculateJourneyRisk(zones = []) {
    if (!zones || zones.length === 0) {
      return {
        overallRisk: 10,
        riskLevel: 'Low',
        maxZoneRisk: 10
      };
    }

    const scores = zones.map(z => z.riskScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);

    // Journey risk heavily factors in worst hotspot along the candidate zone path (70% avg, 30% peak)
    const combinedScore = Math.round(avgScore * 0.7 + maxScore * 0.3);
    const clampedScore = Math.max(0, Math.min(100, combinedScore));

    return {
      overallRisk: clampedScore,
      riskLevel: this.getRiskLevel(clampedScore),
      maxZoneRisk: maxScore
    };
  }
}

module.exports = RiskEngine;
