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

module.exports = router;
