const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('uuid').v4()
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: String,
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
  } catch (err) {
    next(err);
  }
});

adminSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);
