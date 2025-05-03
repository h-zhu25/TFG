// src/controllers/courseController.js
const Course = require('../Models/Course');
const User   = require('../Models/User');

// src/controllers/courseController.js
exports.getAllCourses = async (req, res) => {
  try {
    const { grado, semester, priority } = req.query;
    const userRole = req.user.role;

   
    if (userRole !== 'admin' && !grado) {
      return res.status(403).json({ message: 'Falta Permission' });
    }

   
    const filter = {};
    if (grado)    filter.grados   = grado;
    if (semester) filter.semester = Number(semester);
    if (priority) filter.priority = Number(priority);

    const list = await Course.find(filter)
      .populate('teacher', 'name email')
      .populate('grados',  'name code');

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const c = new Course(req.body);
    await c.save();
    res.status(201).json(c);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const c = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!c) return res.status(404).json({ message: 'Course not found' });
    res.json(c);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'DELETED SUCCEFUL' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCoursesByTeacher = async (req, res) => {
    try {
      const list = await Course
        .find({ teacher: req.params.id })         
        .populate('grados', 'name code')            
        .populate('teacher', 'name email');         
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  // GET /api/teachers/:id/students/:courseId
  
  exports.getStudentsByCourse = async (req, res) => {
    try {
      // 查询所有 selectedCourses.course 包含 courseId 的学生
      const students = await User.find(
        { 'selectedCourses.course': req.params.courseId, role: 'student' },
        'name email studentID'                        
      );
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
