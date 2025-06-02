const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
require('dotenv').config();

// Inițializare aplicație Express
const app = express();

// Conectare la baza de date
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Definire rute
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/observations', require('./src/routes/observation'));

// Rută pentru pagina principală
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Definire port și pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));