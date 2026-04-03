const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  details: String,
  objective: String,
  benefits: String,
  eligibility: String,
  applicationProcedure: String,
  documentsRequired: String,
  level: {
    type: String,
    enum: ['central', 'state', 'district'],
    default: 'central'
  },
  category: {
    type: String,
    index: true
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  embedding: [Number], // Vector embedding for RAG
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scheme', schemeSchema);
