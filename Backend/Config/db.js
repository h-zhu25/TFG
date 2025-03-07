const mongoose = require('mongoose');

function connectDB() {
  mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo connected");
  })
  .catch((error) => {
    console.log("Mongo connection error", error);
  });
}

module.exports = connectDB;
