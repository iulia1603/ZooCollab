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
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
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
      default: 'membru'
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

module.exports = mongoose.model('Project', ProjectSchema);