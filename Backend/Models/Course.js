// models/Course.js
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

/**
 * 每个时段子文档：同时描述了：
 *  - 星期几、开始/结束时间
 *  - 教室（classroom）
 *  - 授课教师（teacher）
 *  - 哪些专业（grados）在这个时段上这门课
 */
const TimeSlotSchema = new Schema({
  day:       { type: String, required: true },                     // e.g. 'Mon'
  start:     { type: String, required: true },                     // e.g. '09:00'
  end:       { type: String, required: true },                     // e.g. '11:00'
  classroom: { type: String, required: true },                     // 教室标识
  teacher:   { type: Schema.Types.ObjectId, ref: 'User', required: true },  // 授课老师
  grados:    [{ type: Schema.Types.ObjectId, ref: 'Grado', required: true }] // 哪些专业可选
});

const courseSchema = new Schema({
  name:          { type: String, required: true, trim: true },     // 课程名称
  code:          { type: String, required: true, unique: true, trim: true }, // 课程代码
  cuantrimestre: { type: String, required: true, trim: true },     // 例如 '2025-1'
  semester:      { type: Number, required: true, enum: [1, 2] },    // 学期：1 或 2
  credits:       { type: Number, required: true },                 // 学分

  // —— 关键变动 ——  
  // 用全新的 TimeSlotSchema 数组替代原来简单的 classTime
  classTime:     { type: [TimeSlotSchema], required: true },

  // （可选）如果你还想保留顶层对所有专业的快速过滤：
  grados: [
    { type: Schema.Types.ObjectId, ref: 'Grado', required: true }
  ],

  priority: {
    type:    Number,
    required:true,
    enum:    [1,2,3,4],
    default: 4
  },

  isSpecialElective: {
    type:    Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
