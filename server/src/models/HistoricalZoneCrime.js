const mongoose = require('mongoose');

const historicalZoneCrimeSchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      required: [true, 'Zone identifier is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100
    },
    reportedCrimes: {
      type: Number,
      required: true,
      min: 0
    },
    detectionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    provenance: {
      sourceWorkbook: String,
      sourceUrl: String,
      extractionMethod: String,
      extractionTimestamp: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound unique index for stable natural key: zone + year
historicalZoneCrimeSchema.index({ zone: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('HistoricalZoneCrime', historicalZoneCrimeSchema);
