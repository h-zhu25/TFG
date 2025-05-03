// src/routes/gradoRoutes.js
const express = require('express');
const router  = express.Router();
const gc      = require('../Controllers/gradoController');


router.get('/',    gc.getAllGrados);
router.get('/:id', gc.getGradoById);

module.exports = router;
