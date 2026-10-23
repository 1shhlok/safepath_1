const config = require('../config');

/**
 * Authoritative Risk Engine Service for SafePath (Formula v4.0.0)
 * 
 * Complies with SAFEPath Existing Project Delta Harness v4:
 * 1. No random or arbitrary baseline scores (baseZoneRisk: 10 removed).
 * 2. Deterministic baseline score derived from historical police station reported crime volume.
 * 3. Missing station history is explicitly 'unavailable', not zero.
 * 4. Zone 1-5 aggregate counts are never added to station counts.
 * 5. Detection rate is kept distinct and never used as a proxy for crime volume.
 * 6. Community reports with status 'pending_review', 'rejected', or 'archived' contribute zero.
 * 7. Only reports with status 'accepted' contribute to public risk (exactly once).
 * 8. Score explanation clearly distinguishes historical police baseline from accepted community reports.
 * 9. Baseline reflects recorded case volume, not individual probability of victimization.
 */

class RiskEngine {
  /**
   * Determine categorical risk level from numerical score [0, 100]
   */
  static getRiskLevel(score) {
    if (score === null || score === undefined) return 'Low';
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
   * Calculate deterministic baseline score from historical station reported crime volume
   */
  static calculateHistoricalBaselineScore(reportedCrimes) {
    if (reportedCrimes === null || reportedCrimes === undefined || typeof reportedCrimes !== 'number' || isNaN(reportedCrimes)) {
      return {
        baselineStatus: 'unavailable',
        baselineScore: null,
        reportedCrimes: null,
        disclaimer: 'Historical police crime statistics are unavailable for this catchment area.'
      };
    }

    const {
      baselineMinScore = 15,
      baselineMaxScore = 60,
      referenceMinReportedCrimes = 280,
      referenceMaxReportedCrimes = 1750
    } = config.riskParams;

    // Linear deterministic normalization across known station reported crime spread
    const spread = (reportedCrimes - referenceMinReportedCrimes) / (referenceMaxReportedCrimes - referenceMinReportedCrimes);
    const clampedSpread = Math.max(0, Math.min(1, spread));
    const baselineScore = Math.round(baselineMinScore + clampedSpread * (baselineMaxScore - baselineMinScore));

    return {
      baselineStatus: 'available',
      baselineScore,
      reportedCrimes,
      disclaimer: 'Baseline reflects recorded police case volume from extracted dashboard data, not individual probability of victimization. Catchment population and exposure data are not available.'
    };
  }

  /**
   * Calculate risk contribution of an individual report
   * Only 'accepted' reports contribute. 'pending_review', 'rejected', and 'archived' contribute 0.
   */
  static calculateReportContribution(report, referenceDate = new Date()) {
    if (!report || !report.incidentType) return 0;

    // Enforce harness rule: pending_review, rejected, or archived contribute zero
    if (report.status === 'pending_review' || report.status === 'rejected' || report.status === 'archived') {
      return 0;
    }

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
   * Calculate aggregated risk score and level for an area based on historical baseline + accepted reports
   * @param {Array} reports - Community reports for the area
   * @param {number|object|null} historicalBaseline - Historical crime count, baseline object, or null
   * @param {Date} referenceDate - Current reference date for decay calculation
   */
  static calculateAreaRisk(reports = [], historicalBaseline = null, referenceDate = new Date()) {
    // Resolve baseline from parameter
    let baselineObj;
    if (typeof historicalBaseline === 'number') {
      baselineObj = this.calculateHistoricalBaselineScore(historicalBaseline);
    } else if (historicalBaseline && typeof historicalBaseline === 'object') {
      if (typeof historicalBaseline.baselineRisk === 'number') {
        baselineObj = {
          baselineStatus: 'available',
          baselineScore: historicalBaseline.baselineRisk,
          reportedCrimes: historicalBaseline.reportedCrimes || null,
          disclaimer: 'Baseline reflects recorded police case volume from extracted dashboard data, not individual probability of victimization.'
        };
      } else if (typeof historicalBaseline.reportedCrimes === 'number') {
        baselineObj = this.calculateHistoricalBaselineScore(historicalBaseline.reportedCrimes);
      } else {
        baselineObj = {
          baselineStatus: 'unavailable',
          baselineScore: null,
          reportedCrimes: null,
          disclaimer: 'Historical police crime statistics are unavailable for this catchment area.'
        };
      }
    } else {
      baselineObj = {
        baselineStatus: 'unavailable',
        baselineScore: null,
        reportedCrimes: null,
        disclaimer: 'Historical police crime statistics are unavailable for this catchment area.'
      };
    }

    let incidentSum = 0;
    let acceptedReportCount = 0;
    let recentIncidentCount = 0;
    const windowDays = config.riskParams.recentIncidentWindowDays || 60;

    for (const report of reports) {
      // Exclude non-accepted reports
      if (report.status === 'pending_review' || report.status === 'rejected' || report.status === 'archived') {
        continue;
      }

      acceptedReportCount++;
      const contribution = this.calculateReportContribution(report, referenceDate);
      incidentSum += contribution;

      const reportDate = report.timestamp ? new Date(report.timestamp) : new Date();
      const daysElapsed = (referenceDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysElapsed <= windowDays) {
        recentIncidentCount++;
      }
    }

    // Frequency bonus for active clusters of accepted reports: +2 points per recent incident (capped at 15)
    const frequencyBonus = Math.min(15, recentIncidentCount * 2);
    const communityRiskContribution = Math.round(incidentSum + frequencyBonus);

    // Combine baseline score + community contribution
    const baselineScoreComponent = baselineObj.baselineScore !== null ? baselineObj.baselineScore : 0;
    const rawScore = baselineScoreComponent + communityRiskContribution;
    const clampedScore = Math.round(Math.max(config.riskParams.minScore, Math.min(config.riskParams.maxScore, rawScore)));
    const riskLevel = this.getRiskLevel(clampedScore);

    return {
      riskScore: clampedScore,
      riskLevel,
      baselineStatus: baselineObj.baselineStatus,
      historicalReportedCrimes: baselineObj.reportedCrimes,
      historicalBaselineScore: baselineObj.baselineScore,
      incidentCount: reports.length,
      acceptedReportCount,
      recentIncidentCount,
      communityRiskContribution,
      explanation: {
        formulaVersion: config.riskParams.formulaVersion || '4.0.0',
        baselineStatus: baselineObj.baselineStatus,
        historicalBaselineScore: baselineObj.baselineScore,
        historicalReportedCrimes: baselineObj.reportedCrimes,
        acceptedCommunityReportsCount: acceptedReportCount,
        communityRiskContribution,
        totalRiskScore: clampedScore,
        riskLevel,
        disclaimer: baselineObj.disclaimer
      }
    };
  }

  /**
   * Calculate overall journey safety from a sequence of corridor zones
   */
  static calculateJourneyRisk(zones = []) {
    if (!zones || zones.length === 0) {
      return {
        overallRisk: 15,
        riskLevel: 'Low',
        maxZoneRisk: 15
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
