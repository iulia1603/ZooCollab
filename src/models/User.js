const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['cercetător', 'administrator', 'student'],
    default: 'cercetător'
  },
  specialization: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Criptare parolă înainte de salvare
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Metodă pentru verificarea parolei
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);