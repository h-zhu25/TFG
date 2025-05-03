// src/routes/teacherRoutes.js
const express = require('express');
const router  = express.Router();
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');
const ctrl    = require('../Controllers/courseController');


router.use(authenticateJWT, authorizeRole('teacher'));


// GET /api/teachers/:id/courses
router.get('/:id/courses', ctrl.getCoursesByTeacher);


// GET /api/teachers/:id/students/:courseId
router.get('/:id/students/:courseId', ctrl.getStudentsByCourse);

module.exports = router;
