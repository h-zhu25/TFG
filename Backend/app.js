require('dotenv').config(); 
const express = require('express');
const connectDB = require('./config/db'); 

const app = express();
app.use(express.json());


connectDB();


app.get('/', (req, res) => {
  res.send("Hello from Backend!");
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
