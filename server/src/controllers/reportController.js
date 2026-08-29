const Report = require('../models/Report');
const Area = require('../models/Area');
const MLService = require('../services/mlService');
const GeocodingService = require('../services/geocodingService');
const RiskEngine = require('../services/riskEngine');

exports.createReport = async (req, res, next) => {
  try {
    const { description, location, latitude, longitude, areaId } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({
        error: 'Please provide a descriptive incident explanation (minimum 5 characters).'
      });
    }

    // 1. Resolve geographic coordinates and zone
    let finalLat, finalLng, resolvedArea;

    if (areaId) {
      resolvedArea = await Area.findById(areaId);
      if (resolvedArea) {
        finalLat = latitude || resolvedArea.center.latitude;
        finalLng = longitude || resolvedArea.center.longitude;
      }
    }

    if (!resolvedArea) {
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        finalLat = latitude;
        finalLng = longitude;
      } else if (location && typeof location === 'string' && location.trim()) {
        const geoResult = await GeocodingService.geocode(location.trim());
        finalLat = geoResult.latitude;
        finalLng = geoResult.longitude;
      } else {
        return res.status(400).json({
          error: 'Please provide a valid location name, area, or coordinates.'
        });
      }

      // Find nearest predefined Nagpur zone
      const allAreas = await Area.find();
      const nearest = GeocodingService.findNearestZone(finalLat, finalLng, allAreas);
      if (!nearest || !nearest.zone) {
        return res.status(400).json({
          error: 'Unable to map coordinates to any known Nagpur zone.'
        });
      }
      resolvedArea = nearest.zone;
    }

    // 2. Perform ML incident classification
    const mlResult = await MLService.classifyIncident(description.trim());

    // 3. Create Report document
    const status = mlResult.isLowConfidence ? 'low_confidence' : 'active';

    const report = new Report({
      userId: req.user._id,
      latitude: finalLat,
      longitude: finalLng,
      areaId: resolvedArea._id,
      description: description.trim(),
      incidentType: mlResult.incidentType,
      confidence: mlResult.confidence,
      timestamp: new Date(),
      status
    });

    await report.save();

    // 4. Authoritative risk recalculation for the affected zone
    const allAreaReports = await Report.find({ areaId: resolvedArea._id, status: { $ne: 'archived' } });
    const calculatedRisk = RiskEngine.calculateAreaRisk(allAreaReports);

    await Area.findByIdAndUpdate(resolvedArea._id, {
      riskScore: calculatedRisk.riskScore,
      riskLevel: calculatedRisk.riskLevel,
      updatedAt: new Date()
    });

    const reportContribution = RiskEngine.calculateReportContribution(report);

    return res.status(201).json({
      message: 'Incident report recorded successfully',
      report: {
        id: report._id,
        description: report.description,
        incidentType: report.incidentType,
        confidence: report.confidence,
        isLowConfidence: mlResult.isLowConfidence,
        timestamp: report.timestamp,
        status: report.status,
        area: {
          id: resolvedArea._id,
          name: resolvedArea.name,
          updatedRiskScore: calculatedRisk.riskScore,
          updatedRiskLevel: calculatedRisk.riskLevel
        },
        riskContribution: Math.round(reportContribution * 10) / 10
      },
      disclaimer: 'AI-generated classification. This does not verify that the reported incident occurred.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const { status, areaId, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (areaId) filter.areaId = areaId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reports = await Report.find(filter)
      .populate('userId', 'name email role')
      .populate('areaId', 'name center riskScore riskLevel')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Report.countDocuments(filter);

    return res.status(200).json({
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      reports
    });
  } catch (err) {
    next(err);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('areaId', 'name center riskScore riskLevel');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
};

exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'low_confidence', 'flagged', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Recalculate area risk if report was flagged or archived
    const allAreaReports = await Report.find({ areaId: report.areaId, status: { $ne: 'archived' } });
    const calculatedRisk = RiskEngine.calculateAreaRisk(allAreaReports);

    await Area.findByIdAndUpdate(report.areaId, {
      riskScore: calculatedRisk.riskScore,
      riskLevel: calculatedRisk.riskLevel,
      updatedAt: new Date()
    });

    return res.status(200).json({
      message: 'Report status updated',
      report
    });
  } catch (err) {
    next(err);
  }
};
