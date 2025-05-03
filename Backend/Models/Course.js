
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const TimeSlotSchema = new Schema({
  day:   { type: String, required: true },  // e.g. 'Mon'
  start: { type: String, required: true },  // e.g. '08:00'
  end:   { type: String, required: true }   // e.g. '10:00'
});

const courseSchema = new Schema({
  name:          { type: String, required: true, trim: true },
  code:          { type: String, required: true, unique: true, trim: true },
  cuantrimestre: { type: String, required: true, trim: true },  // 例如 '2025-1'
  // 学期：1=第一学期，2=第二学期
  semester:      { type: Number, required: true, enum: [1, 2] },
  credits:       { type: Number, required: true },
  classTime:     [ TimeSlotSchema ],      
  teacher:       { type: Schema.Types.ObjectId, ref: 'User', required: true },

  grados: [
    { type: Schema.Types.ObjectId, ref: 'Grado', required: true }
  ],

  priority: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4],
    default: 4
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
