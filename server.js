const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
require('dotenv').config();

// Inițializare aplicație Express
const app = express();

// Verifică variabilele de mediu importante
console.log('🔧 Configurația aplicației:');
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ Setat' : '❌ Nu este setat'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Setat' : '❌ Nu este setat'}`);

// Conectare la baza de date
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pentru logare (doar în development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Servire fișiere statice
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version
  });
});

// API Routes
console.log('📋 Configurez rutele API...');

app.use('/api/auth', require('./src/routes/auth'));
console.log('   ✅ /api/auth');

app.use('/api/projects', require('./src/routes/projects'));
console.log('   ✅ /api/projects');

app.use('/api/observations', require('./src/routes/observation'));
console.log('   ✅ /api/observations');

app.use('/api/profile', require('./src/routes/profile'));
console.log('   ✅ /api/profile');

// Middleware pentru tratarea erorilor
app.use((err, req, res, next) => {
  console.error('🚨 Eroare server:', err.stack);
  
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      message: 'Eroare internă de server',
      error: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({
      message: 'Eroare internă de server'
    });
  }
});

// Middleware pentru rute inexistente
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: `Ruta API ${req.originalUrl} nu a fost găsită`
  });
});

// Rută pentru pagina principală (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Funcție pentru închiderea gracioasă
const gracefulShutdown = () => {
  console.log('\n🛑 Închidere gracioasă a serverului...');
  
  server.close(() => {
    console.log('✅ Serverul HTTP a fost închis');
    
    // Închide conexiunea la MongoDB
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      console.log('✅ Conexiunea MongoDB a fost închisă');
      process.exit(0);
    });
  });
  
  // Forțează închiderea după 10 secunde
  setTimeout(() => {
    console.error('❌ Închiderea forțată a serverului');
    process.exit(1);
  }, 10000);
};

// Event listeners pentru închiderea gracioasă
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Event listener pentru erori nehandled
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection la:', promise, 'motiv:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Definire port și pornire server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🎉 Server pornit cu succes!');
  console.log(`📱 Aplicația este disponibilă la: http://localhost:${PORT}`);
  console.log(`🗄️ Pentru a popula baza de date, rulează: npm run populate`);
  console.log(`🏥 Pentru a verifica starea aplicației, rulează: npm run health-check`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📝 Comenzi utile:');
    console.log('   npm run populate     - Populează baza de date');
    console.log('   npm run health-check - Verifică starea aplicației');
    console.log('   npm run dev          - Pornește serverul în modul development');
    console.log('\n📧 Conturi de test (după populare):');
    console.log('   maria.popescu@unibuc.ro : 123456');
    console.log('   ion.marinescu@ubb.ro    : 123456');
  }
});

module.exports = app;