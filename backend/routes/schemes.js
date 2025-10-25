const express = require('express');
const Joi = require('joi');
const { 
  getAllSchemes, 
  getSchemeById, 
  searchSchemes, 
  getSchemesByCategory 
} = require('../services/database');

const router = express.Router();

// Validation schema for scheme search
const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).optional(),
  category: Joi.string().optional(),
  language: Joi.string().valid('en', 'hi', 'ta').default('en'),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * GET /api/schemes
 * Get all schemes with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { query, category, language, limit, offset } = value;
    
    let schemes = getAllSchemes();
    
    // Apply filters
    if (query) {
      schemes = searchSchemes(query, language);
    }
    
    if (category) {
      schemes = getSchemesByCategory(category, language);
    }
    
    // Apply pagination
    const total = schemes.length;
    const paginatedSchemes = schemes.slice(offset, offset + limit);
    
    // Format response based on language
    const formattedSchemes = paginatedSchemes.map(scheme => formatSchemeForLanguage(scheme, language));
    
    res.json({
      success: true,
      data: formattedSchemes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schemes list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schemes'
    });
  }
});

/**
 * GET /api/schemes/:id
 * Get specific scheme by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    
    const scheme = getSchemeById(id);
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found',
        message: language === 'hi' 
          ? 'योजना नहीं मिली'
          : language === 'ta'
          ? 'திட்டம் கிடைக்கவில்லை'
          : 'Scheme not found'
      });
    }
    
    const formattedScheme = formatSchemeForLanguage(scheme, language);
    
    res.json({
      success: true,
      data: formattedScheme,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Scheme details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheme details'
    });
  }
});

/**
 * GET /api/schemes/categories/list
 * Get list of all categories
 */
router.get('/categories/list', async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const schemes = getAllSchemes();
    
    // Extract unique categories
    const categories = [...new Set(schemes.map(scheme => {
      const categoryField = language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category';
      return scheme[categoryField] || scheme.category;
    }))];
    
    res.json({
      success: true,
      data: categories.sort(),
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Categories list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * GET /api/schemes/categories/:category
 * Get schemes by specific category
 */
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { language = 'en', limit = 20, offset = 0 } = req.query;
    
    const schemes = getSchemesByCategory(category, language);
    
    // Apply pagination
    const total = schemes.length;
    const paginatedSchemes = schemes.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    const formattedSchemes = paginatedSchemes.map(scheme => formatSchemeForLanguage(scheme, language));
    
    res.json({
      success: true,
      data: formattedSchemes,
      category,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      },
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Category schemes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schemes by category'
    });
  }
});

/**
 * GET /api/schemes/search/suggestions
 * Get search suggestions based on partial query
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, language = 'en', limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Query too short'
      });
    }
    
    const schemes = searchSchemes(q, language);
    const suggestions = schemes.slice(0, parseInt(limit)).map(scheme => {
      const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
      return {
        id: scheme.id,
        name: scheme[nameField] || scheme.name,
        category: scheme[language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category'] || scheme.category
      };
    });
    
    res.json({
      success: true,
      data: suggestions,
      query: q,
      language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions'
    });
  }
});

/**
 * Format scheme data for specific language
 */
function formatSchemeForLanguage(scheme, language) {
  const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
  const objectiveField = language === 'hi' ? 'objectiveHindi' : language === 'ta' ? 'objectiveTamil' : 'objective';
  const eligibilityField = language === 'hi' ? 'eligibilityHindi' : language === 'ta' ? 'eligibilityTamil' : 'eligibility';
  const documentsField = language === 'hi' ? 'documentsRequiredHindi' : language === 'ta' ? 'documentsRequiredTamil' : 'documentsRequired';
  const procedureField = language === 'hi' ? 'applicationProcedureHindi' : language === 'ta' ? 'applicationProcedureTamil' : 'applicationProcedure';
  const benefitsField = language === 'hi' ? 'benefitsHindi' : language === 'ta' ? 'benefitsTamil' : 'benefits';
  const deadlineField = language === 'hi' ? 'deadlineHindi' : language === 'ta' ? 'deadlineTamil' : 'deadline';
  const contactField = language === 'hi' ? 'contactInfoHindi' : language === 'ta' ? 'contactInfoTamil' : 'contactInfo';
  const categoryField = language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category';
  
  return {
    id: scheme.id,
    name: scheme[nameField] || scheme.name,
    category: scheme[categoryField] || scheme.category,
    objective: scheme[objectiveField] || scheme.objective,
    eligibility: scheme[eligibilityField] || scheme.eligibility,
    documentsRequired: scheme[documentsField] || scheme.documentsRequired,
    applicationProcedure: scheme[procedureField] || scheme.applicationProcedure,
    benefits: scheme[benefitsField] || scheme.benefits,
    deadline: scheme[deadlineField] || scheme.deadline,
    contactInfo: scheme[contactField] || scheme.contactInfo,
    website: scheme.website,
    lastUpdated: scheme.lastUpdated,
    tags: scheme.tags
  };
}

/**
 * GET /api/schemes/stats
 * Get statistics about schemes
 */
router.get('/stats', async (req, res) => {
  try {
    const schemes = getAllSchemes();
    
    // Calculate statistics
    const totalSchemes = schemes.length;
    const categories = [...new Set(schemes.map(s => s.category))];
    const categoryCounts = {};
    
    schemes.forEach(scheme => {
      categoryCounts[scheme.category] = (categoryCounts[scheme.category] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        totalSchemes,
        totalCategories: categories.length,
        categories: categoryCounts,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schemes stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheme statistics'
    });
  }
});

module.exports = router;
