const { getVectorDB } = require('./vectorDB');
const { translate, detectLanguage } = require('./translation');
const { generateResponse } = require('./llmService');

// RAG Retrieval + Generation Pipeline
class RAGPipeline {
  constructor() {
    this.vectorDB = null;
    this.llmService = null;
  }

  async initialize() {
    this.vectorDB = getVectorDB();
    await this.vectorDB.initialize();
    console.log('✓ RAG Pipeline initialized');
  }

  isGreetingMessage(text = '') {
    const normalized = String(text).trim().toLowerCase();
    if (!normalized) return false;

    const greetingPatterns = [
      /^(hi|hello|hey|hii|heyy)\b/,
      /\b(good\s+morning|good\s+afternoon|good\s+evening)\b/,
      /\b(namaste|namaskar|vanakkam)\b/
    ];

    return greetingPatterns.some((pattern) => pattern.test(normalized));
  }

  getGreetingResponse(language = 'en') {
    const responses = {
      en: 'Hello! I can help you find government schemes by eligibility, benefits, category, or application process. What are you looking for today?',
      hi: 'नमस्ते! मैं आपको सरकारी योजनाएं खोजने में मदद कर सकता हूँ। कृपया बताएं आप किस तरह की योजना ढूंढ रहे हैं?',
      ta: 'வணக்கம்! அரசு திட்டங்களைத் தேட நான் உதவலாம். நீங்கள் எந்த வகை திட்டத்தைத் தேடுகிறீர்கள்?'
    };

    return responses[language] || responses.en;
  }

  // Main chat method
  async chat(userQuery, options = {}) {
    const {
      language = 'en',
      topK = 5,
      temperature = 0.7,
      maxTokens = 500
    } = options;

    try {
      if (!userQuery || !String(userQuery).trim()) {
        return {
          response: 'Please enter a valid question so I can help you with relevant government schemes.',
          language,
          schemes: [],
          confidence: 0
        };
      }

      // 1. Detect source language if not provided
      const detectedLanguage = detectLanguage(userQuery);
      const sourceLanguage = language || detectedLanguage;

      console.log(`Query language detected: ${sourceLanguage}`);

      if (this.isGreetingMessage(userQuery)) {
        return {
          response: this.getGreetingResponse(sourceLanguage),
          language: sourceLanguage,
          schemes: [],
          confidence: 1
        };
      }

      // 2. Translate query to English for retrieval (if needed)
      let queryForRetrieval = userQuery;
      if (sourceLanguage !== 'en') {
        queryForRetrieval = await translate(userQuery, 'en', sourceLanguage);
        console.log(`Translated query: ${queryForRetrieval}`);
      }

      // 3. Retrieve relevant schemes using vector DB
      const retrievedSchemes = await this.vectorDB.searchSchemes(queryForRetrieval, topK);

      if (!retrievedSchemes || retrievedSchemes.length === 0) {
        return {
          response: 'I could not find relevant schemes for your query. Please try asking about specific schemes or benefits.',
          language: sourceLanguage,
          schemes: [],
          confidence: 0
        };
      }

      console.log(`Retrieved ${retrievedSchemes.length} relevant schemes`);

      // 4. Generate response using LLM
      const response = await generateResponse({
        query: userQuery,
        queryEnglish: queryForRetrieval,
        retrievedSchemes,
        language: sourceLanguage,
        temperature,
        maxTokens
      });

      // 5. Translate response back to user language if needed
      let finalResponse = response?.text;
      if (sourceLanguage !== 'en' && response?.text) {
        finalResponse = await translate(response.text, sourceLanguage, 'en');
      }

      if (!finalResponse || String(finalResponse).trim().toLowerCase() === 'undefined') {
        finalResponse = 'I found relevant schemes, but could not generate a clean response this time. Please ask your query once again.';
      }

      return {
        response: finalResponse,
        language: sourceLanguage,
        schemes: retrievedSchemes.map(s => ({
          id: s._id || s.id,
          name: s.name,
          category: s.category || 'General',
          relevanceScore: s.relevanceScore
        })),
        confidence: retrievedSchemes.length > 0 ? retrievedSchemes[0].relevanceScore : 0,
        debug: {
          translatedQuery: queryForRetrieval,
          schemeCount: retrievedSchemes.length
        }
      };
    } catch (error) {
      console.error('RAG pipeline error:', error);
      throw error;
    }
  }

  // Get scheme details
  async getSchemeDetails(schemeId, language = 'en') {
    try {
      const Scheme = require('../models/Scheme');
      let scheme = await Scheme.findById(schemeId);

      if (!scheme) {
        throw new Error('Scheme not found');
      }

      // Update view count
      scheme.viewCount = (scheme.viewCount || 0) + 1;
      await scheme.save();

      // Translate if needed
      if (language !== 'en') {
        const { translateContent } = require('./translation');
        scheme = await translateContent(scheme, language);
      }

      return scheme;
    } catch (error) {
      console.error('Error fetching scheme details:', error);
      throw error;
    }
  }

  // Search schemes with keyword + semantic search
  async searchSchemes(query, options = {}) {
    const {
      language = 'en',
      topK = 10,
      category = null
    } = options;

    try {
      // Retrieve using vector DB
      const results = await this.vectorDB.searchSchemes(query, topK);

      // Filter by category if provided
      let filtered = results;
      if (category) {
        filtered = results.filter(s => s.category?.toLowerCase() === category.toLowerCase());
      }

      // Translate names if needed
      if (language !== 'en') {
        const { translate: translateFunc } = require('./translation');
        for (const scheme of filtered) {
          scheme.name = await translateFunc(scheme.name, language);
        }
      }

      return filtered;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Get RAG stats
  getStats() {
    return {
      vectorDB: this.vectorDB?.getStats() || { status: 'not initialized' }
    };
  }
}

let ragInstance = null;

const getRagPipeline = async () => {
  if (!ragInstance) {
    ragInstance = new RAGPipeline();
    await ragInstance.initialize();
  }
  return ragInstance;
};

module.exports = {
  getRagPipeline,
  RAGPipeline
};
