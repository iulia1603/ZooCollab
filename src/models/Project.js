const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planificat', 'activ', 'finalizat', 'suspendat'],
    default: 'planificat'
  },
  isPublic: {
    type: Boolean,
    default: false // Proiectele sunt private by default
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['co-investigator', 'research-assistant', 'asistent-cercetare', 'observer'],
      default: 'observer'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  }],
  targetSpecies: [{
    scientificName: String,
    commonName: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pentru căutări eficiente
ProjectSchema.index({ isPublic: 1 });
ProjectSchema.index({ creator: 1 });
ProjectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', ProjectSchema);