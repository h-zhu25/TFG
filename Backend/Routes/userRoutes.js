const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
// 引入我们刚才写的中间件
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get(
      '/profile',
      authenticateJWT,
      authorizeRole('admin'),
      userController.getProfile
    );

// 新增：获取用户列表，可通过 ?role=teacher 过滤
router.get(
  '/',                                 // GET /api/users?role=teacher
  authenticateJWT,                     // 必须登录
  authorizeRole('admin'),              // 仅 admin 可调用
  userController.listUsersByRole
);

module.exports = router;
