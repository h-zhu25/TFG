// src/routes/courseRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../Controllers/courseController');
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');

// 所有 /api/courses 路由都需要登录
router.use(authenticateJWT);

// GET 列表：支持 ?grado=&semester=&priority= 过滤（Admin/Teacher/Student 都可调用）
router.get('/', ctrl.getAllCourses);

// 以下接口只有 Admin 能访问
router.post('/',   authorizeRole('admin'), ctrl.createCourse);
router.put('/:id', authorizeRole('admin'), ctrl.updateCourse);
router.delete('/:id', authorizeRole('admin'), ctrl.deleteCourse);

module.exports = router;

