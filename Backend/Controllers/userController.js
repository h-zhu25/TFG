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
