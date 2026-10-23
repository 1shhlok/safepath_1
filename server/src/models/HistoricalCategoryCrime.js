const mongoose = require('mongoose');

const historicalCategoryCrimeSchema = new mongoose.Schema(
  {
    sourceLabel: {
      type: String,
      required: [true, 'Exact source category label is required'],
      trim: true
    },
    categoryMarathi: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100
    },
    reported: {
      type: Number,
      required: true,
      min: 0
    },
    detected: {
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
    classifierMapping: {
      type: String,
      default: null
    },
    isAggregate: {
      type: Boolean,
      default: false
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

// Compound unique index for stable natural key: sourceLabel + year
historicalCategoryCrimeSchema.index({ sourceLabel: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('HistoricalCategoryCrime', historicalCategoryCrimeSchema);
