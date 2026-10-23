const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/safepath',
  jwtSecret: process.env.JWT_SECRET || 'safepath_jwt_fallback_secret_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  mlConfidenceThreshold: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.35'),

  // Centralized Incident Severity Weights
  incidentSeverity: {
    'Suspicious Activity': 5,
    'Theft': 10,
    'Harassment': 15,
    'Robbery': 20,
    'Assault': 25,
    'Other': 5
  },

  // Supported Categories
  supportedCategories: [
    'Theft',
    'Robbery',
    'Harassment',
    'Assault',
    'Suspicious Activity',
    'Other'
  ],

  // Centralized Risk Level Definitions
  riskLevels: {
    LOW: { min: 0, max: 25, label: 'Low', color: '#10B981' },
    MODERATE: { min: 26, max: 50, label: 'Moderate', color: '#F59E0B' },
    HIGH: { min: 51, max: 75, label: 'High', color: '#F97316' },
    CRITICAL: { min: 76, max: 100, label: 'Critical', color: '#EF4444' }
  },

  // Authoritative Risk Engine Parameters (v4.0.0)
  riskParams: {
    formulaVersion: '4.0.0',
    // Deterministic baseline normalization boundaries for historical station crime volume
    baselineMinScore: 15,
    baselineMaxScore: 60,
    referenceMinReportedCrimes: 280, // Approximate min station volume in 2024 workbook data
    referenceMaxReportedCrimes: 1750, // Approximate max station volume in 2024 workbook data
    timeDecayHalfLifeDays: 30, // Reports lose 50% impact after 30 days
    recentIncidentWindowDays: 60,
    confidenceFactorWeight: 1.0,
    maxScore: 100,
    minScore: 0
  }
};

module.exports = config;
