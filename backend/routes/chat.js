const express = require('express');
const Joi = require('joi');
const { searchSimilarSchemes } = require('../services/vectorDB');
const { getSchemeById, addUserQuery } = require('../services/database');
const { translateText } = require('../services/translation');
const LocalLLMService = require('../services/localLLM');
const HuggingFaceLLMService = require('../services/huggingFaceLLM');
const SimpleLocalLLMService = require('../services/simpleLocalLLM');

const router = express.Router();

// Choose your preferred local LLM service
const USE_OLLAMA = process.env.USE_OLLAMA === 'true';
const USE_HUGGINGFACE = process.env.USE_HUGGINGFACE === 'true';

let localLLM;
if (USE_OLLAMA) {
  localLLM = new LocalLLMService();
} else if (USE_HUGGINGFACE) {
  localLLM = new HuggingFaceLLMService();
} else {
  localLLM = new SimpleLocalLLMService(); // Default to simple service
}

// Validation schema for chat request
const chatSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  language: Joi.string().valid('en', 'hi', 'ta').default('en'),
  sessionId: Joi.string().optional()
});

/**
 * POST /api/chat
 * Main chat endpoint for RAG-based responses
 */
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { message, language, sessionId } = value;
    
    console.log(`💬 Chat request: "${message}" in ${language}`);
    
    // Step 1: Translate input to English if needed
    let englishMessage = message;
    if (language !== 'en') {
      try {
        englishMessage = await translateText(message, language, 'en');
        console.log(`🔄 Translated to English: "${englishMessage}"`);
      } catch (translationError) {
        console.warn('⚠️ Translation failed, proceeding with original message:', translationError.message);
      }
    }
    
    // Step 2: Search for relevant schemes using vector similarity
    const relevantSchemes = await searchSimilarSchemes(englishMessage, 3);
    console.log(`🔍 Found ${relevantSchemes.length} relevant schemes`);
    
    // Step 3: Get detailed scheme information
    const schemeDetails = await Promise.all(
      relevantSchemes.map(async (scheme) => {
        const fullScheme = getSchemeById(scheme.id);
        return fullScheme;
      })
    );
    
    // Step 4: Generate response using local LLM with retrieved context
    const response = await generateRAGResponse(englishMessage, schemeDetails, language);
    
    // Step 5: Translate response back to user's language if needed
    let finalResponse = response;
    if (language !== 'en') {
      try {
        finalResponse = await translateText(response, 'en', language);
        console.log(`🔄 Translated response to ${language}`);
      } catch (translationError) {
        console.warn('⚠️ Response translation failed:', translationError.message);
      }
    }
    
    // Step 6: Save user query for analytics
    await addUserQuery(message, finalResponse, language);
    
    // Step 7: Return response
    res.json({
      success: true,
      response: finalResponse,
      relevantSchemes: relevantSchemes.map(scheme => ({
        id: scheme.id,
        name: scheme.name,
        category: scheme.category,
        score: scheme.score
      })),
      language,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || generateSessionId()
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Return a helpful error message
    const errorMessage = language === 'hi' 
      ? 'क्षमा करें, कुछ त्रुटि हुई है। कृपया बाद में पुनः प्रयास करें।'
      : language === 'ta'
      ? 'மன்னிக்கவும், ஏதோ பிழை ஏற்பட்டது. தயவுசெய்து பிறகு மீண்டும் முயற்சிக்கவும்.'
      : 'Sorry, something went wrong. Please try again later.';
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate RAG response using local LLM
 */
async function generateRAGResponse(query, schemes, language) {
  try {
    // Prepare context from retrieved schemes
    const context = schemes.map(scheme => {
      const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
      const objectiveField = language === 'hi' ? 'objectiveHindi' : language === 'ta' ? 'objectiveTamil' : 'objective';
      const eligibilityField = language === 'hi' ? 'eligibilityHindi' : language === 'ta' ? 'eligibilityTamil' : 'eligibility';
      const documentsField = language === 'hi' ? 'documentsRequiredHindi' : language === 'ta' ? 'documentsRequiredTamil' : 'documentsRequired';
      const procedureField = language === 'hi' ? 'applicationProcedureHindi' : language === 'ta' ? 'applicationProcedureTamil' : 'applicationProcedure';
      const benefitsField = language === 'hi' ? 'benefitsHindi' : language === 'ta' ? 'benefitsTamil' : 'benefits';
      const contactField = language === 'hi' ? 'contactInfoHindi' : language === 'ta' ? 'contactInfoTamil' : 'contactInfo';
      
      return `
        Scheme: ${scheme[nameField] || scheme.name}
        Objective: ${scheme[objectiveField] || scheme.objective}
        Eligibility: ${(scheme[eligibilityField] || scheme.eligibility)?.join(', ')}
        Documents Required: ${(scheme[documentsField] || scheme.documentsRequired)?.join(', ')}
        Application Procedure: ${(scheme[procedureField] || scheme.applicationProcedure)?.join(', ')}
        Benefits: ${scheme[benefitsField] || scheme.benefits}
        Contact: ${scheme[contactField] || scheme.contactInfo}
        Website: ${scheme.website}
      `;
    }).join('\n\n');
    
    // Use local LLM to generate response
    const response = await localLLM.generateResponse(query, context, language);
    return response;
    
  } catch (error) {
    console.error('❌ Local LLM error:', error);
    
    // Fallback response
    if (schemes.length > 0) {
      const scheme = schemes[0];
      const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
      const objectiveField = language === 'hi' ? 'objectiveHindi' : language === 'ta' ? 'objectiveTamil' : 'objective';
      
      return `Based on your query, here's information about ${scheme[nameField] || scheme.name}:

${scheme[objectiveField] || scheme.objective}

For more details, please visit: ${scheme.website}
Contact: ${scheme.contactInfo}`;
    }
    
    throw error;
  }
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * GET /api/chat/history
 * Get chat history for a session
 */
router.get('/history', async (req, res) => {
  try {
    const { sessionId, limit = 20 } = req.query;
    
    // In a real application, you would fetch from a database
    // For now, return a simple response
    res.json({
      success: true,
      history: [],
      message: 'Chat history feature coming soon'
    });
    
  } catch (error) {
    console.error('❌ Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

/**
 * POST /api/chat/feedback
 * Submit feedback for a chat response
 */
router.post('/feedback', async (req, res) => {
  try {
    const { sessionId, messageId, rating, feedback } = req.body;
    
    // In a real application, you would save this to a database
    console.log(`📝 Feedback received: ${rating}/5 - ${feedback}`);
    
    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
    
  } catch (error) {
    console.error('❌ Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

module.exports = router;
