require('dotenv').config(); 
const express = require('express');
const connectDB = require('./config/db'); 

const app = express();
app.use(express.json());


connectDB();


const userRoutes = require('./Routes/userRoutes');
app.use('/api/users', userRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
