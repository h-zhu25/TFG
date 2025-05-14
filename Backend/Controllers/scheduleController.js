// src/controllers/scheduleController.js
const { generateSchedules } = require('../services/scheduleService');

exports.getSchedules = async (req, res) => {
  try {
    
    const { selectedCourseIds, preference } = req.body;

    if (!Array.isArray(selectedCourseIds) || selectedCourseIds.length === 0) {
      return res
        .status(400)
        .json({ message: 'At least one course must be selected' });
    }

    
    const { schedules, doNotRecommend } =
      await generateSchedules(selectedCourseIds, preference);

    
    res.json({ schedules, doNotRecommend });
  } catch (err) {
    console.error('Failed to generate schedules:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};