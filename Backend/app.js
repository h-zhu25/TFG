// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 路由
app.use('/api/users',   require('./Routes/userRoutes'));
app.use('/api/courses', require('./Routes/courseRoutes'));
app.use('/api/grados', require('./Routes/gradoRoutes'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// 只有直接运行 `node app.js` 时，这个条件才为真
if (require.main === module) {
  // 这时再去连接真实数据库、启动监听
  const connectDB = require('./Config/db');
  connectDB();  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// 导出 app（供 Jest/Supertest 使用）
module.exports = app;
