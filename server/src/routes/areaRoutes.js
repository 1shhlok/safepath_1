const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

router.get('/', areaController.getAreas);
router.get('/:id', areaController.getAreaById);

module.exports = router;
