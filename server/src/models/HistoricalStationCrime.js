const mongoose = require('mongoose');

const historicalStationCrimeSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: [true, 'Station English name is required'],
      trim: true
    },
    stationMarathi: {
      type: String,
      trim: true,
      default: ''
    },
    sourceLabel: {
      type: String,
      required: true,
      trim: true
    },
    zone: {
      type: String,
      required: true,
      trim: true
    },
    mappingStatus: {
      type: String,
      enum: ['verified_document', 'unverified'],
      required: true
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
    manpower: {
      type: Number,
      default: 0
    },
    fourWheelers: {
      type: Number,
      default: 0
    },
    twoWheelers: {
      type: Number,
      default: 0
    },
    provenance: {
      sourceWorkbook: String,
      sourceUrl: String,
      extractionMethod: String,
      zoneMappingSource: String,
      extractionTimestamp: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound unique index for stable natural key: stationName + year
historicalStationCrimeSchema.index({ stationName: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('HistoricalStationCrime', historicalStationCrimeSchema);
