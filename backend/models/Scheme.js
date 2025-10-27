const mongoose = require('mongoose');

// Define the Scheme Schema
const schemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Scheme name is required'],
    trim: true,
    index: true
  },

  slug: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    default: function() {
      if (this.name) {
        return this.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      return null;
    }
  },

  details: {
    type: String,
    required: [true, 'Scheme details are required'],
    trim: true
  },

  benefits: {
    type: String,
    required: [true, 'Benefits are required'],
    trim: true
  },

  eligibility: {
    type: String,
    required: [true, 'Eligibility criteria are required'],
    trim: true
  },

  application: {
    type: String,
    required: [true, 'Application process is required'],
    trim: true
  },

  documents: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: 'Documents must be an array of strings'
    }
  },

  level: {
    type: String,
    required: [true, 'Scheme level is required'],
    enum: ['Central', 'State', 'Local'],
    trim: true,
    index: true
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },

  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: 'Tags must be an array of strings'
    }
  },

  // Additional metadata
  isActive: {
    type: Boolean,
    default: true
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  },

  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,  // adds createdAt and updatedAt
  collection: 'schemes'
});

// Indexes for better performance
schemeSchema.index({ name: 'text', details: 'text', category: 'text' });
schemeSchema.index({ category: 1, isActive: 1 });
schemeSchema.index({ level: 1 });
schemeSchema.index({ tags: 1 });
schemeSchema.index({ lastUpdated: -1 });

// Pre-save middleware to generate slug if not provided
schemeSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  this.lastUpdated = new Date();
  next();
});

// Method to increment view count
schemeSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to search schemes
schemeSchema.statics.searchSchemes = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { details: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ],
    isActive: true
  }).sort({ lastUpdated: -1 });
};

// Static method to get schemes by category
schemeSchema.statics.getSchemesByCategory = function(category) {
  return this.find({
    category: { $regex: category, $options: 'i' },
    isActive: true
  }).sort({ lastUpdated: -1 });
};

// Static method to get schemes by level
schemeSchema.statics.getSchemesByLevel = function(level) {
  return this.find({
    level: level,
    isActive: true
  }).sort({ lastUpdated: -1 });
};

// Transform JSON output
schemeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Scheme', schemeSchema);
