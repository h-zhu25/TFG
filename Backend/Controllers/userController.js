const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para registrar un usuario
exports.register = async (req, res) => {
  try {
    const { email, username, password, name, role, studentID, grade, teacherID } = req.body;

    // Verificar si el usuario ya existe (por email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Validar campos obligatorios según el rol
    if (role === 'teacher' && !teacherID) {
      return res.status(400).json({ message: 'Al registrarse como profesor, se requiere teacherID' });
    }
    if (role === 'student' && (!studentID || !grade)) {
      return res.status(400).json({ message: 'Al registrarse como estudiante, se requieren studentID y grade' });
    }

    // Crear el nuevo usuario (la contraseña se encriptará en el pre-save)
    const newUser = await User.create({
      email,
      username,
      password,
      name,
      role,
      studentID: role === 'student' ? studentID : undefined,
      grade: role === 'student' ? grade : undefined,
      teacherID: role === 'teacher' ? teacherID : undefined,
      selectedCourses: []
    });

    return res.status(201).json({ message: 'Registro exitoso', user: newUser });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

// Función para iniciar sesión (login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar el usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'El usuario no existe' });
    }

    // Comparar la contraseña ingresada con la encriptada en la base de datos
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Generar un token JWT con el id y rol del usuario, con duración de 1 día
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({ token, message: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getProfile = async (req, res) => {
  try {
        // 把 _id, role, username, name 全都取出来
    const user = await User.findById(req.user.id)
    .select('_id username name role selectedCourses');
    if (!user) {
      return res.status(404).json({ message: 'El usuario no existe.' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.listUsersByRole = async (req, res) => {
  try {
    // 支持按 role 过滤（如 ?role=teacher）
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    // 只返回 _id 和 name 字段，不泄露密码等敏感信息
    const users = await User.find(filter, '_id name');
    res.json(users);
  } catch (err) {
    console.error('listUsersByRole error:', err);
    res.status(500).json({ message: 'No se puede obtener la lista de usuarios' });
  }
};

exports.selectCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedCourses } = req.body;
    if (!Array.isArray(selectedCourses) || selectedCourses.length === 0) {
      return res.status(400).json({ message: 'Por favor, proporciona el arreglo selectedCourses' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'El usuario no existe' });
    }

    // 这里加一个默认空数组，防止 user.selectedCourses 是 undefined
    const existing = Array.isArray(user.selectedCourses)
      ? user.selectedCourses
      : [];

    // 合并去重
    const merged = Array.from(new Set([
      ...existing,
      ...selectedCourses
    ]));
    user.selectedCourses = merged;
    await user.save();

    return res.json({ selectedCourses: user.selectedCourses });
  } catch (err) {
    console.error('selectCourses error:', err);
    return res.status(500).json({ message: 'Error al seleccionar cursos en lote' });
  }
};

exports.unselectCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedCourses } = req.body;

    if (!Array.isArray(selectedCourses)) {
      return res.status(400).json({ message: 'Por favor, proporciona el arreglo selectedCourses' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'El usuario no existe' });
    }

    // 把要移除的 courseIds 全部从 selectedCourses 里 pull 掉
    selectedCourses.forEach(id => {
      const idx = user.selectedCourses.indexOf(id);
      if (idx !== -1) user.selectedCourses.splice(idx, 1);
    });

    await user.save();
    return res.json({ selectedCourses: user.selectedCourses });
  } catch (err) {
    console.error('unselectCourses error:', err);
    return res.status(500).json({ message: 'Error al cancelar la selección del curso' });
  }
};
