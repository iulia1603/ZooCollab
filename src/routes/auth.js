const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware pentru verificarea tokenului JWT
const authMiddleware = (req, res, next) => {
  // Verificare existență token în header
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'Nu există token, autorizare refuzată' });
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
// @desc    Înregistrare utilizator
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, institution, specialization } = req.body;
    
    // Verificare dacă utilizatorul există deja
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Utilizatorul există deja' });
    }
    
    // Creare utilizator nou
    user = new User({
      name,
      email,
      password,
      institution,
      specialization
    });
    
    await user.save();
    
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
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   POST /api/auth/login
// @desc    Autentificare utilizator
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificare utilizator
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credențiale invalide' });
    }
    
    // Verificare parolă
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credențiale invalide' });
    }
    
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
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/auth/user
// @desc    Obținere informații utilizator curent
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;