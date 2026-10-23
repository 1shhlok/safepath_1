const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Area = require('../models/Area');
const AuditLog = require('../models/AuditLog');
const MLService = require('../services/mlService');
const GeocodingService = require('../services/geocodingService');
const RiskEngine = require('../services/riskEngine');
const { LOCAL_UPLOAD_DIR } = require('../middleware/upload');

/**
 * Submit incident report with mandatory evidence image(s)
 * Status is set to 'pending_review' - does not affect public risk.
 */
exports.createReport = async (req, res, next) => {
  try {
    const { description, location, latitude, longitude, areaId } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({
        error: 'Please provide a descriptive incident explanation (minimum 5 characters).'
      });
    }

    // Evidence images are required (validated by upload middleware)
    const evidenceImages = req.evidenceImages || [];
    if (evidenceImages.length === 0) {
      return res.status(400).json({
        error: 'At least one evidence image is required for incident verification (maximum 3 images).'
      });
    }

    // 1. Resolve geographic coordinates and police station area
    let finalLat, finalLng, resolvedArea;

    if (areaId) {
      resolvedArea = await Area.findById(areaId);
      if (resolvedArea) {
        finalLat = typeof latitude === 'number' ? latitude : resolvedArea.center.latitude;
        finalLng = typeof longitude === 'number' ? longitude : resolvedArea.center.longitude;
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

      // Find nearest police station catchment area
      const allAreas = await Area.find();
      const nearest = GeocodingService.findNearestZone(finalLat, finalLng, allAreas);
      if (!nearest || !nearest.zone) {
        return res.status(400).json({
          error: 'Unable to map coordinates to any known Nagpur police station catchment area.'
        });
      }
      resolvedArea = nearest.zone;
    }

    // 2. Perform ML incident classification (text description only)
    const mlResult = await MLService.classifyIncident(description.trim());

    // 3. Create Report document with status 'pending_review'
    const report = new Report({
      userId: req.user._id,
      latitude: finalLat,
      longitude: finalLng,
      areaId: resolvedArea._id,
      description: description.trim(),
      incidentType: mlResult.incidentType,
      confidence: mlResult.confidence,
      timestamp: new Date(),
      status: 'pending_review',
      evidenceImages,
      riskImpactApplied: false
    });

    await report.save();

    // 4. Audit Log Entry
    await AuditLog.create({
      action: 'REPORT_SUBMITTED',
      reportId: report._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      details: {
        areaName: resolvedArea.name,
        incidentType: mlResult.incidentType,
        confidence: mlResult.confidence,
        evidenceCount: evidenceImages.length
      }
    });

    // NOTE: Public risk score is NOT modified here. Only accepted reports affect risk.
    return res.status(201).json({
      message: 'Incident report recorded and submitted for administrator review.',
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
          name: resolvedArea.name
        },
        evidenceImages: report.evidenceImages.map(img => ({
          url: img.url,
          fileName: img.fileName,
          storageType: img.storageType
        }))
      },
      notice: req.isCloudinaryConfigured
        ? 'Evidence secured via Cloudinary authenticated storage.'
        : 'Cloudinary storage not configured in environment. Stored in server-authenticated local storage.',
      disclaimer: 'AI predicts incident category from text only. This does not verify the truth of the complaint or the evidence image. The report will not affect safety scores until administrator review.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get reports with RBAC privacy protection:
 * - Admin can view all reports and filter by any status.
 * - Regular authenticated users can view public ('accepted') reports OR their own reports.
 * - Unauthenticated users can only view 'accepted' reports.
 */
exports.getReports = async (req, res, next) => {
  try {
    const { status, areaId, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (areaId) filter.areaId = areaId;

    const isAdmin = req.user && req.user.role === 'admin';
    const isUser = req.user && req.user.role === 'user';

    if (isAdmin) {
      if (status) filter.status = status;
    } else if (isUser) {
      if (status === 'my_reports' || status === 'pending_review' || status === 'rejected') {
        filter.userId = req.user._id;
        if (status !== 'my_reports') filter.status = status;
      } else {
        // Return accepted reports or user's own reports
        filter.$or = [
          { status: 'accepted' },
          { userId: req.user._id }
        ];
      }
    } else {
      // Public: only accepted reports
      filter.status = 'accepted';
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reports = await Report.find(filter)
      .populate('userId', 'name email role')
      .populate('areaId', 'name center riskScore riskLevel stationMarathi policeZone zoneMappingStatus')
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

/**
 * Get single report by ID with RBAC privacy checks
 */
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('areaId', 'name center riskScore riskLevel stationMarathi policeZone zoneMappingStatus');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const isPublic = report.status === 'accepted';
    const isOwner = req.user && report.userId && (report.userId._id ? report.userId._id.equals(req.user._id) : report.userId.equals(req.user._id));
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isPublic && !isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to view this pending or rejected complaint.'
      });
    }

    return res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin review endpoint: transition report between pending_review, accepted, and rejected
 * Rejection reason is mandatory on rejection.
 * Accepted status updates area risk exactly once.
 */
exports.reviewReport = async (req, res, next) => {
  try {
    const { decision, status, rejectionReason, reviewNotes } = req.body;
    const finalDecision = decision || status;

    const validDecisions = ['accepted', 'rejected', 'archived'];
    if (!validDecisions.includes(finalDecision)) {
      return res.status(400).json({
        error: `Invalid review decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    if (finalDecision === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        error: 'A specific rejection reason is mandatory when rejecting a community complaint.'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const previousStatus = report.status;
    report.status = finalDecision;
    report.review = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      decision: finalDecision,
      rejectionReason: finalDecision === 'rejected' ? rejectionReason.trim() : null,
      reviewNotes: reviewNotes ? reviewNotes.trim() : ''
    };

    // Calculate risk update if status changed to or from accepted
    let updatedArea = null;
    if (finalDecision === 'accepted') {
      report.riskImpactApplied = true;
      const area = await Area.findById(report.areaId);
      const allAcceptedReports = await Report.find({ areaId: report.areaId, status: 'accepted' });
      const calculatedRisk = RiskEngine.calculateAreaRisk(allAcceptedReports, area?.historicalBaseline);

      updatedArea = await Area.findByIdAndUpdate(
        report.areaId,
        {
          riskScore: calculatedRisk.riskScore,
          riskLevel: calculatedRisk.riskLevel,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else if (previousStatus === 'accepted' && finalDecision !== 'accepted') {
      // Reverting an accepted report
      report.riskImpactApplied = false;
      const area = await Area.findById(report.areaId);
      const allAcceptedReports = await Report.find({
        areaId: report.areaId,
        _id: { $ne: report._id },
        status: 'accepted'
      });
      const calculatedRisk = RiskEngine.calculateAreaRisk(allAcceptedReports, area?.historicalBaseline);

      updatedArea = await Area.findByIdAndUpdate(
        report.areaId,
        {
          riskScore: calculatedRisk.riskScore,
          riskLevel: calculatedRisk.riskLevel,
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    await report.save();

    // Persist immutable audit log event
    await AuditLog.create({
      action: finalDecision === 'accepted' ? 'REPORT_REVIEW_ACCEPTED' : 'REPORT_REVIEW_REJECTED',
      reportId: report._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      details: {
        previousStatus,
        newStatus: finalDecision,
        rejectionReason: finalDecision === 'rejected' ? rejectionReason.trim() : null,
        reviewNotes: reviewNotes || '',
        areaUpdated: Boolean(updatedArea),
        newAreaRiskScore: updatedArea ? updatedArea.riskScore : undefined
      }
    });

    return res.status(200).json({
      message: `Report has been ${finalDecision}.`,
      report,
      area: updatedArea
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Backward compatible status update endpoint for existing admin UI
 */
exports.updateReportStatus = exports.reviewReport;

/**
 * Serve local evidence image with authentication and authorization check
 */
exports.serveEvidenceImage = async (req, res, next) => {
  try {
    const safeFileName = path.basename(req.params.filename);
    const filePath = path.join(LOCAL_UPLOAD_DIR, safeFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Evidence file not found.' });
    }

    // Authorization check: Verify user is an admin or the owner of the report referencing this evidence
    const matchingReport = await Report.findOne({
      'evidenceImages.url': { $regex: safeFileName }
    });

    if (matchingReport) {
      const isPublic = matchingReport.status === 'accepted';
      const isOwner = req.user && (
        matchingReport.userId?._id
          ? matchingReport.userId._id.equals(req.user._id)
          : (matchingReport.userId?.equals ? matchingReport.userId.equals(req.user._id) : String(matchingReport.userId) === String(req.user._id))
      );
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isPublic && !isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied. You do not have permission to view private complaint evidence.'
        });
      }
    } else {
      // If file exists on disk but is unassociated with a known report, allow administrators only
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied. Administrator privileges required.'
        });
      }
    }

    return res.sendFile(path.resolve(filePath));
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit logs for administrator oversight
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const logs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .populate('reportId', 'description incidentType status')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await AuditLog.countDocuments();

    return res.status(200).json({
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      logs
    });
  } catch (err) {
    next(err);
  }
};
