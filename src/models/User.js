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
  // Doar dacă parola a fost modificată
  if (!this.isModified('password')) return next();
  
  try {
    // Generează salt și hash-uiește parola
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`🔑 Parola hash-uită pentru ${this.email}: ${this.password.substring(0, 20)}...`);
    next();
  } catch (err) {
    console.error(`❌ Eroare la hash-uirea parolei pentru ${this.email}:`, err);
    next(err);
  }
});

// Metodă pentru verificarea parolei
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log(`🔍 Comparând parola pentru ${this.email}`);
    console.log(`   📝 Parola introdusă: "${candidatePassword}"`);
    console.log(`   🔐 Hash din DB: ${this.password.substring(0, 30)}...`);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(`   ${isMatch ? '✅' : '❌'} Rezultat comparație: ${isMatch}`);
    
    return isMatch;
  } catch (error) {
    console.error(`❌ Eroare la compararea parolei pentru ${this.email}:`, error);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);