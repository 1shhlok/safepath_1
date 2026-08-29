const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');

router.post('/', navigationController.analyzeJourney);

module.exports = router;
