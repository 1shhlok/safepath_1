const mongoose = require('mongoose');

const dataImportLogSchema = new mongoose.Schema(
  {
    importTimestamp: {
      type: Date,
      default: Date.now
    },
    sourceWorkbook: {
      type: String,
      required: true
    },
    isDryRun: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'success'
    },
    summary: {
      totalRowsRead: Number,
      zonesImported: Number,
      stationsImported: Number,
      categoriesImported: Number,
      unverifiedStationMappings: Number,
      duplicatesPrevented: Number,
      rejectedRows: Array,
      warnings: [String]
    },
    provenance: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: false,
    versionKey: false
  }
);

module.exports = mongoose.model('DataImportLog', dataImportLogSchema);
