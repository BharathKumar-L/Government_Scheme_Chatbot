const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Transform CSV row to Scheme model
const transformToScheme = (row, index) => {
  return {
    _id: uuidv4(),
    name: row.name?.trim() || `Scheme ${index}`,
    details: row.details?.trim() || '',
    objective: row.objective?.trim() || '',
    benefits: row.benefits?.trim() || '',
    eligibility: row.eligibility?.trim() || '',
    applicationProcedure: row.application?.trim() || '',
    documentsRequired: row.documents?.trim() || '',
    level: (row.level?.toLowerCase() || 'central').match(/central|state|district/) ? row.level.toLowerCase() : 'central',
    category: row.category?.trim() || 'General',
    tags: parseTags(row.tags),
    isActive: true,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Helper to parse tags
const parseTags = (tagsString) => {
  if (!tagsString) return [];
  return tagsString
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

// Load schemes from CSV file
const loadSchemesFromCSV = async (filePath) => {
  try {
    console.log(`Loading schemes from ${filePath}...`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const rows = await parseCSV(filePath);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const schemes = rows.map((row, index) => transformToScheme(row, index));

    console.log(`✓ Transformed ${schemes.length} schemes`);
    return schemes;
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
};

// Save schemes to MongoDB
const saveSchemesToMongoDB = async (schemes) => {
  try {
    const Scheme = require('../models/Scheme');

    // Clear existing schemes - use deleteMany with proper collection drop
    try {
      await Scheme.collection.drop();
    } catch (err) {
      // Collection might not exist, that's fine
      console.log('Note: no existing schemes collection to drop');
    }

    // Filter out schemes with duplicate IDs (keep first occurrence)
    const seenIds = new Set();
    const uniqueSchemes = schemes.filter(scheme => {
      if (seenIds.has(scheme._id)) {
        return false;
      }
      seenIds.add(scheme._id);
      return true;
    });

    console.log(`Inserting ${uniqueSchemes.length} unique schemes (filtered ${schemes.length - uniqueSchemes.length} duplicates)`);

    // Insert new schemes in batches
    const batchSize = 500;
    for (let i = 0; i < uniqueSchemes.length; i += batchSize) {
      const batch = uniqueSchemes.slice(i, i + batchSize);
      await Scheme.insertMany(batch, { ordered: false }).catch(err => {
        // Ignore duplicate key errors in batch insert
        if (err.code !== 11000) throw err;
      });
    }

    console.log(`✓ Saved ${uniqueSchemes.length} schemes to MongoDB`);
    return uniqueSchemes;
  } catch (error) {
    console.error('Error saving to MongoDB:', error.message);
    throw error;
  }
};

// Load schemes to Vector DB
const loadSchemesToVectorDB = async (schemes) => {
  try {
    const { getVectorDB } = require('./vectorDB');
    const vectorDB = await getVectorDB();

    await vectorDB.initialize();
    vectorDB.clear();

    await vectorDB.addSchemes(schemes);
    console.log(`✓ Loaded ${schemes.length} schemes to Vector DB`);

    return vectorDB.getStats();
  } catch (error) {
    console.error('Error loading to Vector DB:', error);
    throw error;
  }
};

// Full ingestion pipeline
const ingestSchemes = async (filePath) => {
  try {
    console.log('\n=== Starting Scheme Ingestion ===');

    // 1. Parse CSV
    const schemes = await loadSchemesFromCSV(filePath);

    // 2. Save to MongoDB
    try {
      const { isMongoDBConnected } = require('./mongodb');
      if (isMongoDBConnected()) {
        await saveSchemesToMongoDB(schemes);
      }
    } catch (error) {
      console.warn('MongoDB ingestion skipped:', error.message);
    }

    // 3. Load to Vector DB
    await loadSchemesToVectorDB(schemes);

    console.log('=== Ingestion Complete ===\n');

    return {
      success: true,
      schemsCount: schemes.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Ingestion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  parseCSV,
  transformToScheme,
  loadSchemesFromCSV,
  saveSchemesToMongoDB,
  loadSchemesToVectorDB,
  ingestSchemes
};
