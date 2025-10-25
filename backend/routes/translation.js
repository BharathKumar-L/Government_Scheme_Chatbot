const express = require('express');
const Joi = require('joi');
const { translateText, detectLanguage, getSupportedLanguages } = require('../services/translation');

const router = express.Router();

// Validation schema for translation request
const translationSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required(),
  sourceLang: Joi.string().valid('en', 'hi', 'ta', 'auto').default('auto'),
  targetLang: Joi.string().valid('en', 'hi', 'ta').required()
});

/**
 * POST /api/translate
 * Translate text from one language to another
 */
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = translationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { text, sourceLang, targetLang } = value;
    
    console.log(`🔄 Translation request: ${sourceLang} → ${targetLang}`);
    
    // Detect source language if auto
    let detectedSourceLang = sourceLang;
    if (sourceLang === 'auto') {
      detectedSourceLang = detectLanguage(text);
      console.log(`🔍 Detected language: ${detectedSourceLang}`);
    }
    
    // Translate text
    const translatedText = await translateText(text, detectedSourceLang, targetLang);
    
    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: 'Unable to translate the text. Please try again.'
    });
  }
});

/**
 * GET /api/translate/languages
 * Get list of supported languages
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = getSupportedLanguages();
    
    res.json({
      success: true,
      data: languages,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Languages list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported languages'
    });
  }
});

/**
 * POST /api/translate/detect
 * Detect language of the input text
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text is required',
        message: 'Please provide text to detect language'
      });
    }
    
    const detectedLanguage = detectLanguage(text);
    const confidence = 0.8; // Simple confidence score
    
    res.json({
      success: true,
      data: {
        text,
        detectedLanguage,
        confidence,
        languageName: getSupportedLanguages().find(lang => lang.code === detectedLanguage)?.name || 'Unknown'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Language detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Language detection failed'
    });
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts in batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Texts array is required',
        message: 'Please provide an array of texts to translate'
      });
    }
    
    if (texts.length > 50) {
      return res.status(400).json({
        error: 'Too many texts',
        message: 'Maximum 50 texts allowed per batch'
      });
    }
    
    const translations = await Promise.all(
      texts.map(async (text) => {
        try {
          const translated = await translateText(text, sourceLang || 'auto', targetLang);
          return {
            originalText: text,
            translatedText: translated,
            success: true
          };
        } catch (error) {
          return {
            originalText: text,
            translatedText: text,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: {
        translations,
        sourceLanguage: sourceLang || 'auto',
        targetLanguage: targetLang,
        totalTexts: texts.length,
        successfulTranslations: translations.filter(t => t.success).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Batch translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch translation failed'
    });
  }
});

module.exports = router;
