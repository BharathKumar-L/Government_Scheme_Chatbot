const mongoose = require('mongoose');

// Upload Schema for tracking dataset uploads
const uploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['csv', 'json']
  },
  recordsProcessed: {
    type: Number,
    required: true,
    default: 0
  },
  recordsAdded: {
    type: Number,
    required: true,
    default: 0
  },
  recordsSkipped: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'completed', 'failed', 'partial'],
    default: 'processing'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Array of scheme IDs that were created from this upload
  createdSchemeIds: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'uploads'
});

// Indexes
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ status: 1 });
uploadSchema.index({ fileType: 1 });

// Virtual for processing duration
uploadSchema.virtual('processingDuration').get(function() {
  if (this.processingTime > 0) {
    return `${(this.processingTime / 1000).toFixed(2)}s`;
  }
  return 'N/A';
});

// Virtual for success rate
uploadSchema.virtual('successRate').get(function() {
  if (this.recordsProcessed > 0) {
    return `${((this.recordsAdded / this.recordsProcessed) * 100).toFixed(1)}%`;
  }
  return '0%';
});

// Method to mark as completed
uploadSchema.methods.markCompleted = function(added, skipped = 0) {
  this.status = 'completed';
  this.recordsAdded = added;
  this.recordsSkipped = skipped;
  this.processingTime = Date.now() - this.createdAt.getTime();
  return this.save();
};

// Method to mark as failed
uploadSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.processingTime = Date.now() - this.createdAt.getTime();
  return this.save();
};

// Method to mark as partial
uploadSchema.methods.markPartial = function(added, skipped, errorMessage) {
  this.status = 'partial';
  this.recordsAdded = added;
  this.recordsSkipped = skipped;
  this.errorMessage = errorMessage;
  this.processingTime = Date.now() - this.createdAt.getTime();
  return this.save();
};

// Static method to get upload statistics
uploadSchema.statics.getUploadStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUploads: { $sum: 1 },
        totalRecords: { $sum: '$recordsAdded' },
        avgProcessingTime: { $avg: '$processingTime' },
        completedUploads: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedUploads: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get recent uploads
uploadSchema.statics.getRecentUploads = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('filename originalName fileType recordsProcessed recordsAdded status createdAt');
};

// Transform JSON output
uploadSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Upload', uploadSchema);
