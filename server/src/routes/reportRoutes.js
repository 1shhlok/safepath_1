const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Public or Authenticated queries
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);

// Submit report (requires logged in user)
router.post('/', verifyToken, reportController.createReport);

// Update status / moderate report (admin only)
router.patch('/:id/status', verifyToken, requireAdmin, reportController.updateReportStatus);

module.exports = router;
