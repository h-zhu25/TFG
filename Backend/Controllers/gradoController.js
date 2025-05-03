// src/controllers/gradoController.js
const Grado = require('../Models/Grado');

// GET /api/grados
exports.getAllGrados = async (req, res) => {
  try {
    const list = await Grado.find().sort('code');
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/grados/:id
exports.getGradoById = async (req, res) => {
  try {
    const g = await Grado.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Grado not found' });
    res.json(g);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
