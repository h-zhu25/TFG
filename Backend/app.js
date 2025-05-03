// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users',   require('./Routes/userRoutes'));
app.use('/api/courses', require('./Routes/courseRoutes'));
app.use('/api/grados', require('./Routes/gradoRoutes'));
app.use('/api/teachers', require('./Routes/teacherRoutes'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));


if (require.main === module) {
  
  const connectDB = require('./Config/db');
  connectDB();  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


module.exports = app;
