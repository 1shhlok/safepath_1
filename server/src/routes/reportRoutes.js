const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { uploadEvidenceMiddleware, processAndValidateEvidence } = require('../middleware/upload');

// Public or Authenticated report queries
router.get('/', optionalAuth, reportController.getReports);

// Evidence image retrieval (authenticated with authorization check)
router.get('/evidence/:filename', verifyToken, reportController.serveEvidenceImage);

// Administrator audit logs
router.get('/audit/logs', verifyToken, requireAdmin, reportController.getAuditLogs);

// Single report details
router.get('/:id', optionalAuth, reportController.getReportById);

// Submit report with evidence image(s) - authenticated users only
router.post(
  '/',
  verifyToken,
  uploadEvidenceMiddleware,
  processAndValidateEvidence,
  reportController.createReport
);

// Admin moderation decision endpoints
router.patch('/:id/review', verifyToken, requireAdmin, reportController.reviewReport);
router.put('/:id/review', verifyToken, requireAdmin, reportController.reviewReport);
router.patch('/:id/status', verifyToken, requireAdmin, reportController.reviewReport);
router.put('/:id/status', verifyToken, requireAdmin, reportController.reviewReport);

module.exports = router;
