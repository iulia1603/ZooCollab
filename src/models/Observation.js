const mongoose = require('mongoose');

const ObservationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  observer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  species: {
    scientificName: {
      type: String,
      required: true
    },
    commonName: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  observationDate: {
    type: Date,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  notes: String,
  images: [String], // căi către fișierele de imagine
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Adăugare index spațial pentru căutări geografice
ObservationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Observation', ObservationSchema);