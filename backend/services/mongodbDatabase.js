const Scheme = require('../models/Scheme');
const Upload = require('../models/Upload');
const { isConnected } = require('./mongodb');

/**
 * Initialize MongoDB database
 */
async function initializeMongoDBDatabase() {
  try {
    if (!isConnected()) {
      throw new Error('MongoDB not connected');
    }

    // Create indexes if they don't exist
    await Scheme.createIndexes();
    await Upload.createIndexes();

    console.log('✅ MongoDB database initialized');
    return true;
  } catch (error) {
    console.error('❌ MongoDB database initialization failed:', error);
    throw error;
  }
}

/**
 * Get all schemes
 */
async function getAllSchemes() {
  try {
    const schemes = await Scheme.find({ isActive: true }).sort({ lastUpdated: -1 });
    return schemes;
  } catch (error) {
    console.error('❌ Error fetching schemes:', error);
    throw error;
  }
}

/**
 * Get scheme by ID
 */
async function getSchemeById(id) {
  try {
    const scheme = await Scheme.findOne({ id, isActive: true });
    return scheme;
  } catch (error) {
    console.error('❌ Error fetching scheme:', error);
    throw error;
  }
}

/**
 * Search schemes
 */
async function searchSchemes(query, language = 'en') {
  try {
    const schemes = await Scheme.searchSchemes(query, language);
    return schemes;
  } catch (error) {
    console.error('❌ Error searching schemes:', error);
    throw error;
  }
}

/**
 * Get schemes by category
 */
async function getSchemesByCategory(category, language = 'en') {
  try {
    const schemes = await Scheme.getSchemesByCategory(category, language);
    return schemes;
  } catch (error) {
    console.error('❌ Error fetching schemes by category:', error);
    throw error;
  }
}

/**
 * Add a single scheme
 */
async function addScheme(schemeData) {
  try {
    // Check if scheme with same name already exists
    const existingScheme = await Scheme.findOne({ name: schemeData.name });
    if (existingScheme) {
      throw new Error(`Scheme with name '${schemeData.name}' already exists`);
    }

    const scheme = new Scheme(schemeData);
    await scheme.save();

    console.log(`✅ Added scheme: ${scheme.name}`);
    return scheme;
  } catch (error) {
    console.error('❌ Error adding scheme:', error);
    throw error;
  }
}

/**
 * Add multiple schemes
 */
async function addSchemes(schemesData) {
  try {
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const schemeData of schemesData) {
      try {
        if (!schemeData.name) {
          results.skipped++;
          results.errors.push('Scheme missing required field: name');
          continue;
        }

        // Check if scheme exists
        const existingScheme = await Scheme.findOne({ name: schemeData.name });
        
        // Prepare scheme data with required fields
        const schemeToSave = {
          ...schemeData,
          lastUpdated: new Date(),
          isActive: true,
          tags: schemeData.tags || [],
          id: schemeData.id || `${schemeData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        };

        if (existingScheme) {
          // Update existing scheme
          await Scheme.findOneAndUpdate(
            { name: schemeData.name },
            schemeToSave,
            { new: true, runValidators: true }
          );
          results.updated++;
        } else {
          // Create new scheme
          const scheme = new Scheme(schemeToSave);
          await scheme.save();
          results.added++;
        }
      } catch (error) {
        results.skipped++;
        results.errors.push(`Error processing scheme '${schemeData.name || 'unknown'}': ${error.message}`);
        console.error('Error processing scheme:', error);
      }
    }

    console.log(`✅ Added ${results.added} schemes, updated ${results.updated}, skipped ${results.skipped}`);
    if (results.errors.length > 0) {
      console.log('❌ Errors:', results.errors);
    }
    return results;
  } catch (error) {
    console.error('❌ Error adding schemes:', error);
    throw error;
  }
}

/**
 * Update scheme
 */
async function updateScheme(name, updateData) {
  try {
    const scheme = await Scheme.findOneAndUpdate(
      { name, isActive: true },
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!scheme) {
      throw new Error(`Scheme '${name}' not found`);
    }

    console.log(`✅ Updated scheme: ${scheme.name}`);
    return scheme;
  } catch (error) {
    console.error('❌ Error updating scheme:', error);
    throw error;
  }
}

/**
 * Delete scheme (soft delete)
 */
async function deleteScheme(name) {
  try {
    const scheme = await Scheme.findOneAndUpdate(
      { name, isActive: true },
      { isActive: false, lastUpdated: new Date() },
      { new: true }
    );

    if (!scheme) {
      throw new Error(`Scheme '${name}' not found`);
    }

    console.log(`✅ Deleted scheme: ${scheme.name}`);
    return scheme;
  } catch (error) {
    console.error('❌ Error deleting scheme:', error);
    throw error;
  }
}


/**
 * Get scheme statistics
 */
async function getSchemeStats() {
  try {
    const stats = await Scheme.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalSchemes: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          categories: { $addToSet: '$category' },
          avgViews: { $avg: '$viewCount' }
        }
      }
    ]);

    const categoryStats = await Scheme.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgViews: { $avg: '$viewCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      ...stats[0],
      categories: stats[0]?.categories || [],
      categoryBreakdown: categoryStats
    };
  } catch (error) {
    console.error('❌ Error fetching scheme stats:', error);
    throw error;
  }
}

/**
 * Get popular schemes
 */
async function getPopularSchemes(limit = 10) {
  try {
    const schemes = await Scheme.getPopularSchemes(limit);
    return schemes;
  } catch (error) {
    console.error('❌ Error fetching popular schemes:', error);
    throw error;
  }
}

/**
 * Get recent schemes
 */
async function getRecentSchemes(limit = 10) {
  try {
    const schemes = await Scheme.getRecentSchemes(limit);
    return schemes;
  } catch (error) {
    console.error('❌ Error fetching recent schemes:', error);
    throw error;
  }
}

/**
 * Increment scheme view count
 */
async function incrementSchemeViewCount(id) {
  try {
    const scheme = await Scheme.findOneAndUpdate(
      { id, isActive: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    return scheme;
  } catch (error) {
    console.error('❌ Error incrementing view count:', error);
    throw error;
  }
}

/**
 * Create upload record
 */
async function createUploadRecord(uploadData) {
  try {
    const upload = new Upload(uploadData);
    await upload.save();
    return upload;
  } catch (error) {
    console.error('❌ Error creating upload record:', error);
    throw error;
  }
}

/**
 * Update upload record
 */
async function updateUploadRecord(uploadId, updateData) {
  try {
    const upload = await Upload.findByIdAndUpdate(
      uploadId,
      updateData,
      { new: true, runValidators: true }
    );
    return upload;
  } catch (error) {
    console.error('❌ Error updating upload record:', error);
    throw error;
  }
}

/**
 * Get upload statistics
 */
async function getUploadStats() {
  try {
    const stats = await Upload.getUploadStats();
    return stats[0] || {
      totalUploads: 0,
      totalRecords: 0,
      avgProcessingTime: 0,
      completedUploads: 0,
      failedUploads: 0
    };
  } catch (error) {
    console.error('❌ Error fetching upload stats:', error);
    throw error;
  }
}

/**
 * Get recent uploads
 */
async function getRecentUploads(limit = 10) {
  try {
    const uploads = await Upload.getRecentUploads(limit);
    return uploads;
  } catch (error) {
    console.error('❌ Error fetching recent uploads:', error);
    throw error;
  }
}

module.exports = {
  initializeMongoDBDatabase,
  getAllSchemes,
  getSchemeById,
  searchSchemes,
  getSchemesByCategory,
  addScheme,
  addSchemes,
  updateScheme,
  deleteScheme,
  getSchemeStats,
  getPopularSchemes,
  getRecentSchemes,
  incrementSchemeViewCount,
  createUploadRecord,
  updateUploadRecord,
  getUploadStats,
  getRecentUploads
};
