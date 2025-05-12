const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
// 引入我们刚才写的中间件
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
 // GET /api/users/profile
 // 只要登录即可获取自身信息（id, role, name...）
 router.get(
   '/profile',
   authenticateJWT,
   userController.getProfile
 );


// 新增：获取用户列表，可通过 ?role=teacher 过滤
router.get(
  '/',                                 // GET /api/users?role=teacher
  authenticateJWT,                     // 必须登录
  authorizeRole('admin'),              // 仅 admin 可调用
  userController.listUsersByRole
);

router.post(
  '/select-courses',
  authenticateJWT,
  authorizeRole('student'),
  userController.selectCourses
);

module.exports = router;
