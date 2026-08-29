const Area = require('../models/Area');
const Report = require('../models/Report');

exports.getAreas = async (req, res, next) => {
  try {
    const areas = await Area.find().sort({ name: 1 });
    return res.status(200).json({
      count: areas.length,
      areas
    });
  } catch (err) {
    next(err);
  }
};

exports.getAreaById = async (req, res, next) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const reports = await Report.find({ areaId: area._id })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-userId');

    return res.status(200).json({
      area,
      recentReports: reports
    });
  } catch (err) {
    next(err);
  }
};
