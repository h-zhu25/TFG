// scripts/seedGrados.js
require('dotenv').config();
const mongoose = require('mongoose');
const Grado    = require('../Models/Grado');

const GRADOS = [
  { name: 'Ingeniería del Software', code: 'IW', department: 'ETSISI' },
  { name: 'Ingeniería de Computadores',            code: 'IC', department: 'ETSISI' },
  { name: 'Tecnologías para la Sociedad de la Información',                 code: 'TSI', department: 'ETSISI' },
  { name: 'Sistemas de Información',                code: 'SI', department: 'ETSISI' },
 
  
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    for (const g of GRADOS) {
      
      await Grado.updateOne(
        { code: g.code },
        { $set: g },
        { upsert: true }
      );
      console.log(`  • Seeded grado ${g.code}`);
    }

    console.log(' All grados have been seeded.');
    process.exit(0);
  } catch (err) {
    console.error(' Seeding error:', err);
    process.exit(1);
  }
}

seed();
