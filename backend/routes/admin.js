const express = require('express');
const multer = require('multer');
const Admin = require('../models/Admin');
const Scheme = require('../models/Scheme');
const { v4: uuidv4 } = require('uuid');
const { ingestSchemes } = require('../services/dataIngestion');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

// In-memory session store (in production, use Redis)
const adminSessions = new Map();

// Admin login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Default admin credentials (in production, should be hashed in DB)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ruralconnect.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const sessionId = uuidv4();

      adminSessions.set(sessionId, {
        email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      return res.json({
        success: true,
        data: {
          sessionId,
          email,
          expiresIn: 86400 // 24 hours in seconds
        }
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  } catch (error) {
    next(error);
  }
});

// Verify session middleware
const verifyAdminSession = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionId = req.headers['x-admin-session'] || bearerToken || req.body?.sessionId || req.query?.sessionId;

  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired session'
    });
  }

  const session = adminSessions.get(sessionId);
  if (new Date() > session.expiresAt) {
    adminSessions.delete(sessionId);
    return res.status(401).json({
      success: false,
      error: 'Session expired'
    });
  }

  req.adminSession = session;
  next();
};

// Admin logout
router.post('/logout', verifyAdminSession, async (req, res, next) => {
  try {
    const sessionId = req.headers['x-admin-session'];
    adminSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get admin stats
router.get('/stats', verifyAdminSession, async (req, res, next) => {
  try {
    const totalSchemes = await Scheme.countDocuments({});
    const activeSchemes = await Scheme.countDocuments({ isActive: true });
    const categories = await Scheme.distinct('category');
    const totalViews = await Scheme.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalSchemes,
        activeSchemes,
        inactiveSchemes: totalSchemes - activeSchemes,
        categoriesCount: categories.length,
        totalViews: totalViews[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create scheme
router.post('/schemes', verifyAdminSession, async (req, res, next) => {
  try {
    const { name, details, benefits, eligibility, applicationProcedure, documentsRequired, level, category } = req.body;

    const scheme = new Scheme({
      _id: uuidv4(),
      name,
      details,
      benefits,
      eligibility,
      applicationProcedure,
      documentsRequired,
      level: level || 'central',
      category: category || 'General',
      isActive: true
    });

    await scheme.save();

    // Update vector DB
    try {
      const { getVectorDB } = require('../services/vectorDB');
      const vectorDB = getVectorDB();
      await vectorDB.addSchemes([scheme]);
    } catch (err) {
      console.warn('Could not update vector DB:', err.message);
    }

    res.status(201).json({
      success: true,
      data: { scheme }
    });
  } catch (error) {
    next(error);
  }
});

// Update scheme
router.put('/schemes/:id', verifyAdminSession, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const scheme = await Scheme.findByIdAndUpdate(id, updates, { new: true });

    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found'
      });
    }

    // Update vector DB
    try {
      const { getVectorDB } = require('../services/vectorDB');
      const vectorDB = getVectorDB();
      await vectorDB.updateScheme(id, scheme);
    } catch (err) {
      console.warn('Could not update vector DB:', err.message);
    }

    res.json({
      success: true,
      data: { scheme }
    });
  } catch (error) {
    next(error);
  }
});

// Delete scheme
router.delete('/schemes/:id', verifyAdminSession, async (req, res, next) => {
  try {
    const { id } = req.params;

    const scheme = await Scheme.findByIdAndDelete(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found'
      });
    }

    // Update vector DB
    try {
      const { getVectorDB } = require('../services/vectorDB');
      const vectorDB = getVectorDB();
      await vectorDB.deleteScheme(id);
    } catch (err) {
      console.warn('Could not update vector DB:', err.message);
    }

    res.json({
      success: true,
      message: 'Scheme deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Upload CSV dataset
router.post('/upload-dataset', verifyAdminSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`Processing uploaded file: ${req.file.filename}`);

    const result = await ingestSchemes(req.file.path);

    // Delete uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  verifyAdminSession
};
