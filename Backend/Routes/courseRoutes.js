// src/routes/courseRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const ctrl    = require('../Controllers/courseController');
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');

// 所有 /api/courses 路由都需要登录
router.use(authenticateJWT);

// GET 列表：支持 ?grado=&semester=&priority= 过滤（Admin/Teacher/Student 都可调用）
router.get('/', ctrl.getAllCourses);

// 以下接口只有 Admin 能访问，并对 classTime 子文档做校验
const courseValidationRules = [
  body('name').isString().notEmpty(),
  body('code').isString().notEmpty(),
  body('cuantrimestre').isString().notEmpty(),
  body('semester').isInt({ min: 1, max: 2 }),
  body('credits').isInt({ min: 0 }),
  body('priority').optional().isInt({ min: 1, max: 4 }),
  body('isSpecialElective').optional().isBoolean(),
  body('classTime').isArray({ min: 1 }),
  body('classTime.*.day').isString().notEmpty(),
  body('classTime.*.start').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('classTime.*.end').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('classTime.*.classroom').isString().notEmpty(),
  body('classTime.*.teacher').isMongoId(),
  body('classTime.*.grados').isArray({ min: 1 }),
  body('classTime.*.grados.*').isMongoId()
];

router.post(
  '/',
  authorizeRole('admin'),
  courseValidationRules,
  ctrl.createCourse
);

router.put(
  '/:id',
  authorizeRole('admin'),
  // 对更新接口同样校验，但字段全可选
  courseValidationRules.map(rule => rule.optional()),
  ctrl.updateCourse
);

router.delete('/:id', authorizeRole('admin'), ctrl.deleteCourse);

module.exports = router;
