// src/controllers/scheduleController.js
const { generateSchedules } = require('../services/scheduleService');

exports.getSchedules = async (req, res) => {
  try {
    const { selectedCourseIds } = req.body;
    if (!Array.isArray(selectedCourseIds) || selectedCourseIds.length === 0) {
      return res.status(400).json({ message: 'At least one course must be selected' });
    }

    const { schedules, doNotRecommend } = await generateSchedules(selectedCourseIds);

    // Format the output for the front end
    const formatted = schedules.map(schedule =>
      schedule.map(({ course, slot }) => ({
        courseId:   course._id,
        courseName: course.name,
        day:        slot.day,
        startTime:  slot.start,
        endTime:    slot.end
      }))
    );

    res.json({ schedules: formatted, doNotRecommend });
  } catch (err) {
    console.error('Failed to generate schedules:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
