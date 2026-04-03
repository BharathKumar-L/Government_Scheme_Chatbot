const express = require('express');
const Scheme = require('../models/Scheme');
const { getRagPipeline } = require('../services/ragPipeline');

const router = express.Router();

// GET /api/schemes - List all schemes with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, language = 'en' } = req.query;

    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const schemes = await Scheme.find(query)
      .skip(skip)
      .limit(Number(limit))
      .select('-embedding')
      .exec();

    const total = await Scheme.countDocuments(query);

    // Translate if needed
    if (language !== 'en') {
      const { translateContent } = require('../services/translation');
      for (let i = 0; i < schemes.length; i++) {
        schemes[i] = await translateContent(schemes[i], language);
      }
    }

    res.json({
      success: true,
      data: {
        schemes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/schemes/categories - Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Scheme.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        categories: categories.sort()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/schemes/search - Search schemes
router.get('/search', async (req, res, next) => {
  try {
    const { q, language = 'en', limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Use RAG for semantic search
    const ragPipeline = await getRagPipeline();
    const results = await ragPipeline.searchSchemes(q, {
      language,
      topK: Number(limit)
    });

    res.json({
      success: true,
      data: {
        results,
        query: q
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/schemes/:id - Get scheme details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    let scheme = await Scheme.findById(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found'
      });
    }

    // Update view count
    scheme.viewCount = (scheme.viewCount || 0) + 1;
    await scheme.save();

    // Translate if needed
    if (language !== 'en') {
      const { translateContent } = require('../services/translation');
      scheme = await translateContent(scheme.toObject(), language);
    }

    res.json({
      success: true,
      data: { scheme }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/schemes/stats/overview - Get schemes statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const totalSchemes = await Scheme.countDocuments({ isActive: true });
    const totalCategories = await Scheme.distinct('category', { isActive: true });
    const topSchemes = await Scheme.find({ isActive: true })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name viewCount category');

    res.json({
      success: true,
      data: {
        totalSchemes,
        totalCategories: totalCategories.length,
        topSchemes
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
