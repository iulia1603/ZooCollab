const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zoocollab');
    console.log(`MongoDB conectat: ${conn.connection.host}`);
  } catch (err) {
    console.error('Eroare la conectarea la MongoDB:', err.message);
    // Continuă execuția pentru dezvoltare, chiar dacă MongoDB nu este disponibil
    console.log('Continuăm fără MongoDB pentru moment...');
  }
};

module.exports = connectDB;