const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { requireAdminAuth, verifyCredentials, createAdminSession, destroyAdminSession } = require('../services/adminAuth');
const { getAllSchemes, getSchemeById, searchSchemes, addUserQuery, getUserQueries, addSchemes, saveSchemesToFile } = require('../services/database');
const { 
  getAllSchemes: mongoGetAllSchemes, 
  getSchemeById: mongoGetSchemeById,
  addScheme: mongoAddScheme,
  addSchemes: mongoAddSchemes, 
  updateScheme: mongoUpdateScheme, 
  deleteScheme: mongoDeleteScheme,
  getSchemeStats: mongoGetSchemeStats,
  createUploadRecord,
  updateUploadRecord,
  getUploadStats,
  getRecentUploads
} = require('../services/mongodbDatabase');
const { addSchemeToVectorDB } = require('../services/vectorDB');
const { isConnected } = require('../services/mongodb');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow JSON and CSV files
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.json') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and CSV files are allowed'), false);
    }
  }
});

/**
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    if (verifyCredentials(username, password)) {
      const sessionToken = createAdminSession(username);
      
      res.cookie('adminSession', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        sessionToken
      });
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * Admin logout
 */
router.post('/logout', requireAdminAuth, (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.adminSession;
    
    destroyAdminSession(sessionToken);
    
    res.clearCookie('adminSession');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * Verify admin session
 */
router.get('/verify', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Session is valid',
    admin: req.adminSession.username
  });
});

/**
 * Get all schemes (admin view with additional data)
 */
router.get('/schemes', requireAdminAuth, async (req, res) => {
  try {
    let schemes, queries;
    
    if (isConnected()) {
      // Use MongoDB
      schemes = await mongoGetAllSchemes();
      queries = getUserQueries(100); // Still use file-based for queries
    } else {
      // Fallback to file-based database
      schemes = getAllSchemes();
      queries = getUserQueries(100);
    }
    
    res.json({
      success: true,
      data: {
        schemes: schemes.map(scheme => ({
          id: scheme.id,
          name: scheme.name,
          category: scheme.category,
          lastUpdated: scheme.lastUpdated,
          tags: scheme.tags || [],
          viewCount: scheme.viewCount || 0,
          source: scheme.source || 'Manual Entry'
        })),
        totalSchemes: schemes.length,
        recentQueries: queries.slice(0, 10),
        database: isConnected() ? 'MongoDB' : 'File-based'
      }
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({
      error: 'Failed to fetch schemes',
      message: error.message
    });
  }
});

/**
 * Get scheme details by ID
 */
router.get('/schemes/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = getSchemeById(id);
    
    if (!scheme) {
      return res.status(404).json({
        error: 'Scheme not found',
        message: `No scheme found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({
      error: 'Failed to fetch scheme',
      message: error.message
    });
  }
});

/**
 * Add new scheme
 */
router.post('/schemes', requireAdminAuth, async (req, res) => {
  try {
    const schemeData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'details', 'benefits', 'eligibility', 'application', 'level'];
    const missingFields = requiredFields.filter(field => !schemeData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`
      });
    }
    
    // Generate unique ID if not provided
    const id = schemeData.id || `${schemeData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const newScheme = {
      id,
      ...schemeData,
      lastUpdated: new Date().toISOString(),
      tags: schemeData.tags || [],
      isActive: true
    };

    // First, save to MongoDB if connected
    if (isConnected()) {
      try {
        // Save to MongoDB
        const savedScheme = await mongoAddScheme(newScheme);
        console.log('✅ Scheme saved to MongoDB successfully');

        // Then, add to Vector DB
        try {
          await addSchemeToVectorDB(savedScheme);
          console.log('✅ Scheme added to Vector DB successfully');
          
          res.status(201).json({
            success: true,
            message: 'Scheme added successfully to both databases',
            data: savedScheme
          });
        } catch (vectorDbError) {
          console.error('⚠️ Error adding scheme to vector database:', vectorDbError);
          // Don't fail the request if vector DB fails, but notify in response
          res.status(201).json({
            success: true,
            message: 'Scheme added to MongoDB but failed to add to Vector DB',
            data: savedScheme,
            warning: 'Vector DB update failed'
          });
        }
      } catch (mongoError) {
        console.error('❌ Error saving to MongoDB:', mongoError);
        throw mongoError;
      }
    } else {
      // Fallback to file-based storage
      console.log('⚠️ MongoDB not connected, falling back to file storage');
      const schemes = getAllSchemes();
      schemes.push(newScheme);
      await saveSchemesToFile();
      
      // Try to add to Vector DB even in file-based mode
      try {
        await addSchemeToVectorDB(newScheme);
        console.log('✅ Scheme added to Vector DB successfully');
      } catch (vectorDbError) {
        console.error('⚠️ Error adding scheme to vector database:', vectorDbError);
      }
      
      res.status(201).json({
        success: true,
        message: 'Scheme added successfully to file storage',
        data: newScheme
      });
    }
  } catch (error) {
    console.error('❌ Error adding scheme:', error);
    res.status(500).json({
      error: 'Failed to add scheme',
      message: error.message
    });
  }
});

/**
 * Update existing scheme
 */
router.put('/schemes/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const schemes = getAllSchemes();
    const schemeIndex = schemes.findIndex(scheme => scheme.id === id);
    
    if (schemeIndex === -1) {
      return res.status(404).json({
        error: 'Scheme not found',
        message: `No scheme found with ID: ${id}`
      });
    }
    
    // Update scheme
    schemes[schemeIndex] = {
      ...schemes[schemeIndex],
      ...updateData,
      id, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString()
    };
    
    // Save to file
    const DATA_DIR = path.join(__dirname, '../data');
    const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
    await fs.writeFile(SCHEMES_FILE, JSON.stringify(schemes, null, 2));
    
    res.json({
      success: true,
      message: 'Scheme updated successfully',
      data: schemes[schemeIndex]
    });
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(500).json({
      error: 'Failed to update scheme',
      message: error.message
    });
  }
});

/**
 * Delete scheme
 */
router.delete('/schemes/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const schemes = getAllSchemes();
    const schemeIndex = schemes.findIndex(scheme => scheme.id === id);
    
    if (schemeIndex === -1) {
      return res.status(404).json({
        error: 'Scheme not found',
        message: `No scheme found with ID: ${id}`
      });
    }
    
    // Remove scheme
    const deletedScheme = schemes.splice(schemeIndex, 1)[0];
    
    // Save to file
    const DATA_DIR = path.join(__dirname, '../data');
    const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
    await fs.writeFile(SCHEMES_FILE, JSON.stringify(schemes, null, 2));
    
    res.json({
      success: true,
      message: 'Scheme deleted successfully',
      data: deletedScheme
    });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({
      error: 'Failed to delete scheme',
      message: error.message
    });
  }
});

/**
 * Save dataset to database
 */
async function saveDatasetToDatabase(processedData, filename, fileSize, fileType) {
  try {
    const startTime = Date.now();
    
    // Create upload record
    const uploadRecord = await createUploadRecord({
      filename: filename,
      originalName: filename,
      fileSize: fileSize,
      fileType: fileType,
      recordsProcessed: processedData.length,
      uploadedBy: 'admin'
    });

    // Convert CSV/JSON data to scheme format
    const schemes = processedData.map((item, index) => {
      // Generate unique ID
      const id = item.id || `${item.name?.toLowerCase().replace(/\s+/g, '-') || 'scheme'}-${Date.now()}-${index}`;
      
      // Map common field names
      const scheme = {
        id,
        name: item.name || item.scheme_name || item.title || 'Untitled Scheme',
        slug: item.slug || id,
        details: item.details || item.description || item.objective || item.purpose || '',
        category: item.category || item.scheme_category || item.type || 'General',
        level: item.level || 'Central', // Default to Central if not specified
        eligibility: item.eligibility || '',
        application: item.application || item.application_process || item.procedure || '',
        documents: Array.isArray(item.documents) ? item.documents : 
                  (item.documents ? [item.documents] : []),
        applicationProcedure: Array.isArray(item.applicationProcedure) ? item.applicationProcedure : 
                             (item.procedure || item.application_process ? [item.procedure || item.application_process] : []),
        applicationProcedureHindi: Array.isArray(item.applicationProcedureHindi) ? item.applicationProcedureHindi : 
                                  (item.procedure_hindi || item.application_process_hindi ? [item.procedure_hindi || item.application_process_hindi] : []),
        applicationProcedureTamil: Array.isArray(item.applicationProcedureTamil) ? item.applicationProcedureTamil : 
                                  (item.procedure_tamil || item.application_process_tamil ? [item.procedure_tamil || item.application_process_tamil] : []),
        benefits: item.benefits || item.benefit_amount || item.amount || '',
        benefitsHindi: item.benefitsHindi || item.benefit_amount_hindi || item.amount_hindi || '',
        lastUpdated: new Date(),
        isActive: true,
        tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(',').map(t => t.trim())) : [],
        source: `Uploaded from ${filename}`,
        uploadedBy: 'admin'
      };
      
      return scheme;
    });
    
    let results;
    if (isConnected()) {
      // Use MongoDB
      results = await mongoAddSchemes(schemes);
      
      // Update upload record with results
      await updateUploadRecord(uploadRecord._id, {
        recordsAdded: results.added,
        recordsSkipped: results.skipped,
        status: results.added > 0 ? 'completed' : 'failed',
        errorMessage: results.errors.length > 0 ? results.errors.join('; ') : null,
        createdSchemeIds: schemes.slice(0, results.added).map(s => s.id)
      });
    } else {
      // Fallback to file-based database
      await addSchemes(schemes);
      results = { added: schemes.length, skipped: 0, errors: [] };
      
      // Update upload record
      await updateUploadRecord(uploadRecord._id, {
        recordsAdded: results.added,
        status: 'completed'
      });
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Added ${results.added} schemes from ${filename} to database (${processingTime}ms)`);
    
    return {
      added: results.added,
      skipped: results.skipped,
      errors: results.errors,
      processingTime
    };
    
  } catch (error) {
    console.error('❌ Error saving dataset to database:', error);
    throw error;
  }
}

/**
 * Upload dataset file
 */
router.post('/upload-dataset', requireAdminAuth, (req, res) => {
  const uploadHandler = upload.single('dataset');
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 50MB'
        });
      }
      return res.status(400).json({
        error: 'Upload failed',
        message: err.message
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }
    
    const { originalname, mimetype, path: filePath } = req.file;
    
    // Process the uploaded file based on type
    let processedData = [];
    
    if (mimetype === 'application/json' || originalname.endsWith('.json')) {
      const fileContent = await fs.readFile(filePath, 'utf8');
      processedData = JSON.parse(fileContent);
    } else if (mimetype === 'text/csv' || originalname.endsWith('.csv')) {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      processedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    }
    
    // Clean up uploaded file
    await fs.unlink(filePath);
    
    // Save processed data to database
    let saveResults = { added: 0, skipped: 0, errors: [] };
    if (processedData.length > 0) {
      saveResults = await saveDatasetToDatabase(
        processedData, 
        originalname, 
        req.file.size, 
        mimetype === 'application/json' ? 'json' : 'csv'
      );
    }
    
    res.json({
      success: true,
      message: 'Dataset uploaded and processed successfully',
      data: {
        filename: originalname,
        records: processedData.length,
        added: saveResults.added,
        skipped: saveResults.skipped,
        errors: saveResults.errors,
        processingTime: saveResults.processingTime,
        preview: processedData.slice(0, 5), // First 5 records as preview
        database: isConnected() ? 'MongoDB' : 'File-based'
      }
    });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      
      // Clean up file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({
        error: 'Failed to upload dataset',
        message: error.message
      });
    }
  });
});

/**
 * Get system statistics
 */
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    let stats;
    
    if (isConnected()) {
      // Use MongoDB
      const schemeStats = await mongoGetSchemeStats();
      const uploadStats = await getUploadStats();
      const recentUploads = await getRecentUploads(5);
      const queries = getUserQueries();
      
      stats = {
        totalSchemes: schemeStats.totalSchemes || 0,
        totalQueries: queries.length,
        totalViews: schemeStats.totalViews || 0,
        avgViews: schemeStats.avgViews || 0,
        categories: schemeStats.categories || [],
        categoryBreakdown: schemeStats.categoryBreakdown || [],
        uploadStats: {
          totalUploads: uploadStats.totalUploads || 0,
          totalRecords: uploadStats.totalRecords || 0,
          avgProcessingTime: uploadStats.avgProcessingTime || 0,
          completedUploads: uploadStats.completedUploads || 0,
          failedUploads: uploadStats.failedUploads || 0
        },
        recentUploads: recentUploads.map(upload => ({
          filename: upload.originalName,
          records: upload.recordsAdded,
          status: upload.status,
          date: upload.createdAt
        })),
        recentActivity: queries.slice(0, 10).map(q => ({
          query: q.query,
          timestamp: q.timestamp,
          language: q.language
        })),
        database: 'MongoDB'
      };
    } else {
      // Fallback to file-based database
      const schemes = getAllSchemes();
      const queries = getUserQueries();
      
      stats = {
        totalSchemes: schemes.length,
        totalQueries: queries.length,
        totalViews: 0,
        avgViews: 0,
        categories: [...new Set(schemes.map(s => s.category))],
        categoryBreakdown: [],
        uploadStats: {
          totalUploads: 0,
          totalRecords: 0,
          avgProcessingTime: 0,
          completedUploads: 0,
          failedUploads: 0
        },
        recentUploads: [],
        recentActivity: queries.slice(0, 10).map(q => ({
          query: q.query,
          timestamp: q.timestamp,
          language: q.language
        })),
        database: 'File-based'
      };
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;
