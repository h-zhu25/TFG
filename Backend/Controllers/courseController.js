// src/controllers/courseController.js
const Course = require('../Models/Course');
const mongoose = require('mongoose');
const User   = require('../Models/User');

// GET /api/courses
// （Admin/Teacher/Student 均可调用；非 Admin 必须带 ?grado=）  
exports.getAllCourses = async (req, res) => {
  try {
    const { grado, semester, priority } = req.query;
    const userRole = req.user.role;

    // ——【新增】—— 只有 Admin 可以不带 grado 参数
    if (userRole !== 'admin' && !grado) {
      return res.status(403).json({ message: 'Falta Permission' });
    }

    // 按查询过滤（可选顶层 grados 过滤，若保留顶层字段）
    const filter = {};
    if (grado)    filter.grados   = grado;
    if (semester) filter.semester = Number(semester);
    if (priority) filter.priority = Number(priority);

    // ——【修改】—— 由原来的 populate('teacher')，改为填充每个时段的 teacher，
    // 并同时填充课程的 grados（若保留顶层 field）
    const list = await Course.find(filter)
      .populate('classTime.teacher', 'name email')
      .populate('grados',          'name code');

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses
// （仅 Admin）  
exports.createCourse = async (req, res) => {
  try {
    // 接收 body 中每个 classTime[{…}] 自带 classroom/teacher/grados
    const c = new Course(req.body);
    await c.save();

    // ——【新增】—— 保存后 populate 时段里的 teacher 信息
    await c.populate('classTime.teacher', 'name email');

    res.status(201).json(c);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/courses/:id
// （仅 Admin）  
exports.updateCourse = async (req, res) => {
  try {
    const c = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!c) return res.status(404).json({ message: 'Course not found' });

    // ——【新增】—— 更新后同样 populate 时段教师
    await c.populate('classTime.teacher', 'name email');

    res.json(c);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { grado }     = req.query;

    // 如果指定了 grado，就只移除这一门课在该 grado 下的关联
    if (grado) {
      // 1. 先把整条课程找出来
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
      }

      // 2. Mongoose 里的 Array.pull() 会自动把字符串转 ObjectId
      course.grados.pull(grado);

      // 3. 同样对每个 classTime 子文档里的 grados 数组也 pull 一遍
      course.classTime.forEach(ct => {
        ct.grados.pull(grado);
      });

      // 4. 存回数据库
      await course.save();

      // 5. 再次查一遍并 populate 返回给前端
      const updated = await Course.findById(courseId)
        .populate('classTime.teacher', 'name email')
        .populate('grados', 'name code');

      return res.json(updated);
    }

    // 否则就彻底删掉整条课程
    await Course.findByIdAndDelete(courseId);
    res.json({ message: 'DELETED SUCCESSFUL' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teachers/:id/courses
// ——【修改】—— 原先按顶层 teacher 过滤，改为查 classTime.teacher  
exports.getCoursesByTeacher = async (req, res) => {
  try {
    const list = await Course.find({ 'classTime.teacher': req.params.id })
      .populate('classTime.teacher', 'name email')
      .populate('grados',            'name code');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teachers/:id/students/:courseId
// ——【 unchanged 】—— 老师继续能看到所有选了这门课的学生  
exports.getStudentsByCourse = async (req, res) => {
  try {
    const students = await User.find(
      { 'selectedCourses.course': req.params.courseId, role: 'student' },
      'name email studentID'
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
