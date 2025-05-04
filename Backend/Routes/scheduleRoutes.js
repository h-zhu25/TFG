// Backend/Routes/scheduleRoutes.js
const express = require('express');
const router  = express.Router();
const { authenticateJWT, authorizeRole } = require('../Middlewares/Auth');
const ctrl    = require('../Controllers/scheduleController');

router.post(
  '/',
  authenticateJWT,
  authorizeRole('student'),
  ctrl.getSchedules
);

module.exports = router;
