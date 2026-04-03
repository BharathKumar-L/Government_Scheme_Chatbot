const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: String,
    language: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    userLanguage: String,
    ipAddress: String,
    userAgent: String,
    isVoiceInput: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
