const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'REPORT_SUBMITTED',
        'REPORT_REVIEW_ACCEPTED',
        'REPORT_REVIEW_REJECTED',
        'REPORT_ARCHIVED',
        'DATA_IMPORT_EXECUTED'
      ]
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

auditLogSchema.index({ reportId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
