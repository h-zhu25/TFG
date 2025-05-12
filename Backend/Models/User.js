const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Se usa el correo electrónico como principal identificador para registro y login
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Nombre de usuario (opcional)
  username: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  // Rol del usuario: puede ser 'admin', 'student' o 'teacher'
  role: {
    type: String,
    enum: ['admin', 'student', 'teacher'],
    required: true
  },
  // Campos específicos para estudiantes
  studentID: {
    type: String
  },
  grade: {
    type: String
  },
  // Campo específico para profesores
  teacherID: {
    type: String
  },
  // Registros de cursos seleccionados (para estudiantes)
    selectedCourses: {
    type: [String],      // 字符串数组
    ref: 'Course',       // 引用 Course
    default: []          // 默认空数组
  }
}, {
  timestamps: true  
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
