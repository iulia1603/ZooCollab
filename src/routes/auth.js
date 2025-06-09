const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware pentru verificarea tokenului JWT
const authMiddleware = (req, res, next) => {
  // Verificare existenta token in header
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'Nu exista token, autorizare refuzata' });
  }

  try {
    // Verificare validitate token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tokenSecret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// @route   POST /api/auth/register
// @desc    inregistrare utilizator
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, institution, specialization } = req.body;
    
    console.log(`📝 Tentativa de inregistrare pentru: ${email}`);
    
    // Verificare daca utilizatorul exista deja
    let user = await User.findOne({ email });
    if (user) {
      console.log(`❌ Utilizatorul ${email} exista deja`);
      return res.status(400).json({ msg: 'Utilizatorul exista deja' });
    }
    
    // Creare utilizator nou
    user = new User({
      name,
      email,
      password, // Va fi hash-uita automat de middleware-ul pre('save')
      institution,
      specialization
    });
    
    await user.save();
    console.log(`✅ Utilizator nou creat: ${email}`);
    
    // Generare token JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'tokenSecret',
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        console.log(`🔑 Token generat pentru ${email}`);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('❌ Eroare la inregistrare:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   POST /api/auth/login
// @desc    Autentificare utilizator
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Tentativa de autentificare pentru: ${email}`);
    console.log(`📝 Parola introdusa: "${password}"`);
    
    // Verificare utilizator
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ Utilizatorul ${email} nu a fost gasit`);
      return res.status(400).json({ msg: 'Credentiale invalide' });
    }
    
    console.log(`✅ Utilizator gasit: ${user.name}`);
    console.log(`🔐 Hash parola din DB: ${user.password.substring(0, 30)}...`);
    
    // Verificare parola
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Parola incorecta pentru ${email}`);
      return res.status(400).json({ msg: 'Credentiale invalide' });
    }
    
    console.log(`✅ Autentificare reusita pentru ${email}`);
    
    // Generare token JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'tokenSecret',
      { expiresIn: '1d' },
      (err, token) => {
        if (err) {
          console.error(`❌ Eroare la generarea token-ului pentru ${email}:`, err);
          throw err;
        }
        console.log(`🎉 Token generat cu succes pentru ${email}`);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('❌ Eroare la autentificare:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/auth/user
// @desc    Obtinere informatii utilizator curent
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log(`👤 Informatii utilizator cerute pentru: ${user.email}`);
    res.json(user);
  } catch (err) {
    console.error('❌ Eroare la obtinerea informatiilor utilizatorului:', err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;