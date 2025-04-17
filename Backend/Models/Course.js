const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },
  
  cuantrimestre: {
    type: String,
    required: true,
    trim: true
  },
 
  semester: {
    type: String,
    enum: ['Primera Cuatrimestre', 'Segunda Cuatrimestre'],
    
  },
  
  credits: {
    type: Number,
    required: true
  },
  
  classTime: {
    type: String,
    required: true,
    trim: true
  },
  
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
