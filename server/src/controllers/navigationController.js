const Area = require('../models/Area');
const ZoneRecommendationService = require('../services/zoneRecommendationService');

exports.analyzeJourney = async (req, res, next) => {
  try {
    const { source, destination } = req.body;

    if (!source || typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({ error: 'Source location or zone is required' });
    }

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({ error: 'Destination location or zone is required' });
    }

    const allAreas = await Area.find();
    if (!allAreas || allAreas.length === 0) {
      return res.status(503).json({
        error: 'Nagpur zone database is not yet initialized. Please seed the database first.'
      });
    }

    const analysis = await ZoneRecommendationService.analyzeJourney(
      source.trim(),
      destination.trim(),
      allAreas
    );

    return res.status(200).json(analysis);
  } catch (err) {
    next(err);
  }
};
