const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required'],
      unique: true,
      trim: true
    },
    center: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
      }
    },
    riskScore: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Low'
    },
    neighbors: [
      {
        type: String,
        trim: true
      }
    ],
    stationMarathi: {
      type: String,
      trim: true,
      default: ''
    },
    policeZone: {
      type: String,
      trim: true,
      default: 'Unverified — Zone 1/2 or check current roster'
    },
    zoneMappingStatus: {
      type: String,
      enum: ['verified_document', 'unverified'],
      default: 'unverified'
    },
    coordinateType: {
      type: String,
      default: 'approximate_station_marker'
    },
    historicalBaseline: {
      year: Number,
      reportedCrimes: Number,
      detectionRate: Number,
      baselineRisk: Number
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Update updatedAt on save
areaSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Area', areaSchema);
