const express = require('express');
const Joi = require('joi');
const RAGTrainer = require('../services/ragTrainer');
const GovernmentDataScraper = require('../services/dataScraper');

const router = express.Router();

// Validation schema for training request
const trainingSchema = Joi.object({
  forceRetrain: Joi.boolean().default(false),
  dataSources: Joi.array().items(Joi.string().valid('myscheme', 'nsp', 'pmkisan')).default(['myscheme', 'nsp', 'pmkisan'])
});

/**
 * POST /api/training/train
 * Train the RAG model with fresh data
 */
router.post('/train', async (req, res) => {
  try {
    // Validate request
    const { error, value } = trainingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { forceRetrain, dataSources } = value;
    
    console.log('🚀 Starting RAG model training...');
    
    const trainer = new RAGTrainer();
    
    // Check if retraining is needed
    if (!forceRetrain) {
      const stats = await trainer.getTrainingStats();
      const lastTraining = new Date(stats.lastTrainingDate);
      const hoursSinceTraining = (Date.now() - lastTraining.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceTraining < 24) {
        return res.json({
          success: true,
          message: 'Model was trained recently. Use forceRetrain=true to retrain anyway.',
          lastTraining: stats.lastTrainingDate,
          hoursSinceTraining: Math.round(hoursSinceTraining)
        });
      }
    }
    
    // Start training
    const results = await trainer.trainRAGModel();
    
    res.json({
      success: true,
      message: 'RAG model training completed successfully',
      results
    });
    
  } catch (error) {
    console.error('❌ Training error:', error);
    res.status(500).json({
      success: false,
      error: 'Training failed',
      message: error.message
    });
  }
});

/**
 * POST /api/training/retrain
 * Retrain the model with fresh data
 */
router.post('/retrain', async (req, res) => {
  try {
    console.log('🔄 Starting model retraining...');
    
    const trainer = new RAGTrainer();
    const results = await trainer.retrainModel();
    
    res.json({
      success: true,
      message: 'Model retraining completed',
      results
    });
    
  } catch (error) {
    console.error('❌ Retraining error:', error);
    res.status(500).json({
      success: false,
      error: 'Retraining failed',
      message: error.message
    });
  }
});

/**
 * GET /api/training/status
 * Get training status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const trainer = new RAGTrainer();
    const scraper = new GovernmentDataScraper();
    
    const [trainingStats, scrapingStats] = await Promise.all([
      trainer.getTrainingStats(),
      scraper.getScrapingStats()
    ]);
    
    res.json({
      success: true,
      data: {
        training: trainingStats,
        scraping: scrapingStats,
        modelHealth: {
          isHealthy: trainingStats.trainingAccuracy > 0.8,
          lastUpdate: trainingStats.lastTrainingDate,
          totalSchemes: trainingStats.totalSchemes
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get training status',
      message: error.message
    });
  }
});

/**
 * POST /api/training/fetch-data
 * Fetch fresh data from government sources
 */
router.post('/fetch-data', async (req, res) => {
  try {
    console.log('📡 Fetching fresh government scheme data...');
    
    const scraper = new GovernmentDataScraper();
    const schemes = await scraper.fetchAllSchemeData();
    
    res.json({
      success: true,
      message: 'Data fetching completed',
      data: {
        totalSchemes: schemes.length,
        sources: [...new Set(schemes.map(s => s.source))],
        categories: [...new Set(schemes.map(s => s.category))],
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Data fetching error:', error);
    res.status(500).json({
      success: false,
      error: 'Data fetching failed',
      message: error.message
    });
  }
});

/**
 * GET /api/training/examples
 * Get training examples
 */
router.get('/examples', async (req, res) => {
  try {
    const { limit = 50, category, language } = req.query;
    
    const trainer = new RAGTrainer();
    const examples = await trainer.loadTrainingExamples();
    
    let filteredExamples = examples;
    
    // Filter by category
    if (category) {
      filteredExamples = filteredExamples.filter(ex => ex.category === category);
    }
    
    // Filter by language
    if (language) {
      filteredExamples = filteredExamples.filter(ex => ex.language === language);
    }
    
    // Limit results
    filteredExamples = filteredExamples.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        examples: filteredExamples,
        total: examples.length,
        filtered: filteredExamples.length
      }
    });
    
  } catch (error) {
    console.error('❌ Examples fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training examples',
      message: error.message
    });
  }
});

/**
 * POST /api/training/validate
 * Validate the trained model
 */
router.post('/validate', async (req, res) => {
  try {
    const { testQueries } = req.body;
    
    if (!testQueries || !Array.isArray(testQueries)) {
      return res.status(400).json({
        error: 'testQueries array is required'
      });
    }
    
    const trainer = new RAGTrainer();
    const validationResults = [];
    
    for (const query of testQueries) {
      try {
        const { searchSimilarSchemes } = require('../services/vectorDB');
        const results = await searchSimilarSchemes(query, 3);
        
        validationResults.push({
          query,
          results: results.map(r => ({
            schemeId: r.id,
            schemeName: r.name,
            relevanceScore: r.score
          })),
          success: results.length > 0
        });
      } catch (error) {
        validationResults.push({
          query,
          error: error.message,
          success: false
        });
      }
    }
    
    const successRate = validationResults.filter(r => r.success).length / validationResults.length;
    
    res.json({
      success: true,
      data: {
        validationResults,
        successRate,
        totalQueries: testQueries.length,
        successfulQueries: validationResults.filter(r => r.success).length
      }
    });
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/training/sources
 * Get available data sources
 */
router.get('/sources', async (req, res) => {
  try {
    const scraper = new GovernmentDataScraper();
    const stats = await scraper.getScrapingStats();
    
    res.json({
      success: true,
      data: {
        availableSources: [
          {
            name: 'MyScheme.gov.in',
            id: 'myscheme',
            description: 'Central government schemes portal',
            status: 'active'
          },
          {
            name: 'National Scholarship Portal',
            id: 'nsp',
            description: 'Education and scholarship schemes',
            status: 'active'
          },
          {
            name: 'PM Kisan Portal',
            id: 'pmkisan',
            description: 'Agriculture and farmer schemes',
            status: 'active'
          }
        ],
        lastScraping: stats.lastUpdated,
        totalSchemes: stats.totalSchemes
      }
    });
    
  } catch (error) {
    console.error('❌ Sources fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data sources',
      message: error.message
    });
  }
});

module.exports = router;
