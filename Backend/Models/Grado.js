// src/models/Grado.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gradoSchema = new Schema({
  name:       { type: String, required: true, unique: true },
  code:       { type: String, required: true, unique: true },
  department: { type: String }
}, {
  versionKey: false,
  timestamps: false
});

module.exports = mongoose.model('Grado', gradoSchema);
