/**
 * Simple Local LLM Service
 * A lightweight alternative that doesn't require external model dependencies
 * Uses rule-based responses with semantic matching
 */

class SimpleLocalLLMService {
  constructor() {
    this.initialized = false;
    this.schemeKeywords = this.initializeSchemeKeywords();
  }

  /**
   * Initialize scheme-specific keywords for better matching
   */
  initializeSchemeKeywords() {
    return {
      'pm-kisan': ['pm kisan', 'kisan', 'farmer', 'agriculture', 'income support', 'crop', 'land'],
      'mgnrega': ['mgnrega', 'nrega', 'employment', 'job', 'work', 'rural', 'guarantee'],
      'pmay': ['pmay', 'housing', 'house', 'home', 'construction', 'urban', 'rural housing'],
      'general': ['scheme', 'government', 'benefit', 'welfare', 'support', 'assistance']
    };
  }

  /**
   * Generate embeddings using simple text hashing
   */
  async generateEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach(word => {
      const hash = word.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const index = Math.abs(hash) % 384;
      embedding[index] += 1;
    });
    
    return embedding;
  }

  /**
   * Generate response using rule-based system
   */
  async generateResponse(query, context, language = 'en') {
    try {
      // Extract scheme information from context
      const schemeInfo = this.extractSchemeInfo(context);
      
      // Generate response based on query type
      const response = this.generateContextualResponse(query, schemeInfo, language);
      
      return response;
    } catch (error) {
      console.error('❌ Simple LLM generation failed:', error);
      return this.generateFallbackResponse(language);
    }
  }

  /**
   * Extract scheme information from context
   */
  extractSchemeInfo(context) {
    const schemes = [];
    const contextBlocks = context.split('\n\n');
    
    contextBlocks.forEach(block => {
      if (block.includes('Scheme:')) {
        const scheme = {
          name: this.extractField(block, 'Scheme:'),
          objective: this.extractField(block, 'Objective:'),
          eligibility: this.extractField(block, 'Eligibility:'),
          documents: this.extractField(block, 'Documents Required:'),
          procedure: this.extractField(block, 'Application Procedure:'),
          benefits: this.extractField(block, 'Benefits:'),
          contact: this.extractField(block, 'Contact:'),
          website: this.extractField(block, 'Website:')
        };
        schemes.push(scheme);
      }
    });
    
    return schemes;
  }

  /**
   * Extract field value from text block
   */
  extractField(block, fieldName) {
    const lines = block.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(fieldName)) {
        return line.replace(fieldName, '').trim();
      }
    }
    return '';
  }

  /**
   * Generate contextual response based on query and scheme info
   */
  generateContextualResponse(query, schemes, language) {
    const queryLower = query.toLowerCase();
    
    // Determine response type
    if (this.isGeneralQuery(queryLower)) {
      return this.generateGeneralResponse(schemes, language);
    } else if (this.isEligibilityQuery(queryLower)) {
      return this.generateEligibilityResponse(schemes, language);
    } else if (this.isProcedureQuery(queryLower)) {
      return this.generateProcedureResponse(schemes, language);
    } else if (this.isBenefitQuery(queryLower)) {
      return this.generateBenefitResponse(schemes, language);
    } else {
      return this.generateComprehensiveResponse(schemes, language);
    }
  }

  /**
   * Check if query is about general information
   */
  isGeneralQuery(query) {
    const generalKeywords = ['what is', 'tell me about', 'explain', 'information', 'details'];
    return generalKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is about eligibility
   */
  isEligibilityQuery(query) {
    const eligibilityKeywords = ['eligible', 'eligibility', 'qualify', 'qualification', 'who can apply'];
    return eligibilityKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is about application procedure
   */
  isProcedureQuery(query) {
    const procedureKeywords = ['how to apply', 'application', 'procedure', 'process', 'steps', 'documents'];
    return procedureKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Check if query is about benefits
   */
  isBenefitQuery(query) {
    const benefitKeywords = ['benefit', 'amount', 'money', 'payment', 'support', 'assistance'];
    return benefitKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Generate general response
   */
  generateGeneralResponse(schemes, language) {
    if (schemes.length === 0) {
      return this.getLocalizedMessage('no_schemes_found', language);
    }

    const scheme = schemes[0];
    const responses = {
      en: `**${scheme.name}**

**Objective:** ${scheme.objective}

**Benefits:** ${scheme.benefits}

**Eligibility:** ${scheme.eligibility}

For more information, visit: ${scheme.website}
Contact: ${scheme.contact}`,

      hi: `**${scheme.name}**

**उद्देश्य:** ${scheme.objective}

**लाभ:** ${scheme.benefits}

**पात्रता:** ${scheme.eligibility}

अधिक जानकारी के लिए: ${scheme.website}
संपर्क: ${scheme.contact}`,

      ta: `**${scheme.name}**

**நோக்கம்:** ${scheme.objective}

**நன்மைகள்:** ${scheme.benefits}

**தகுதி:** ${scheme.eligibility}

மேலும் தகவலுக்கு: ${scheme.website}
தொடர்பு: ${scheme.contact}`
    };

    return responses[language] || responses.en;
  }

  /**
   * Generate eligibility response
   */
  generateEligibilityResponse(schemes, language) {
    if (schemes.length === 0) {
      return this.getLocalizedMessage('no_schemes_found', language);
    }

    const scheme = schemes[0];
    const responses = {
      en: `**Eligibility for ${scheme.name}:**

${scheme.eligibility}

For detailed eligibility criteria, visit: ${scheme.website}`,

      hi: `**${scheme.name} के लिए पात्रता:**

${scheme.eligibility}

विस्तृत पात्रता मानदंड के लिए: ${scheme.website}`,

      ta: `**${scheme.name} க்கான தகுதி:**

${scheme.eligibility}

விரிவான தகுதி விதிமுறைகளுக்கு: ${scheme.website}`
    };

    return responses[language] || responses.en;
  }

  /**
   * Generate procedure response
   */
  generateProcedureResponse(schemes, language) {
    if (schemes.length === 0) {
      return this.getLocalizedMessage('no_schemes_found', language);
    }

    const scheme = schemes[0];
    const responses = {
      en: `**How to Apply for ${scheme.name}:**

**Documents Required:**
${scheme.documents}

**Application Procedure:**
${scheme.procedure}

**Contact:** ${scheme.contact}
**Website:** ${scheme.website}`,

      hi: `**${scheme.name} के लिए कैसे आवेदन करें:**

**आवश्यक दस्तावेज:**
${scheme.documents}

**आवेदन प्रक्रिया:**
${scheme.procedure}

**संपर्क:** ${scheme.contact}
**वेबसाइट:** ${scheme.website}`,

      ta: `**${scheme.name} க்கு எவ்வாறு விண்ணப்பிக்கலாம்:**

**தேவையான ஆவணங்கள்:**
${scheme.documents}

**விண்ணப்ப நடைமுறை:**
${scheme.procedure}

**தொடர்பு:** ${scheme.contact}
**வலைத்தளம்:** ${scheme.website}`
    };

    return responses[language] || responses.en;
  }

  /**
   * Generate benefit response
   */
  generateBenefitResponse(schemes, language) {
    if (schemes.length === 0) {
      return this.getLocalizedMessage('no_schemes_found', language);
    }

    const scheme = schemes[0];
    const responses = {
      en: `**Benefits of ${scheme.name}:**

${scheme.benefits}

For more details, contact: ${scheme.contact}`,

      hi: `**${scheme.name} के लाभ:**

${scheme.benefits}

अधिक जानकारी के लिए संपर्क करें: ${scheme.contact}`,

      ta: `**${scheme.name} இன் நன்மைகள்:**

${scheme.benefits}

மேலும் விவரங்களுக்கு தொடர்பு கொள்ளவும்: ${scheme.contact}`
    };

    return responses[language] || responses.en;
  }

  /**
   * Generate comprehensive response
   */
  generateComprehensiveResponse(schemes, language) {
    if (schemes.length === 0) {
      return this.getLocalizedMessage('no_schemes_found', language);
    }

    const scheme = schemes[0];
    const responses = {
      en: `**${scheme.name} - Complete Information**

**Objective:** ${scheme.objective}

**Eligibility:** ${scheme.eligibility}

**Benefits:** ${scheme.benefits}

**Documents Required:** ${scheme.documents}

**Application Procedure:** ${scheme.procedure}

**Contact Information:** ${scheme.contact}
**Official Website:** ${scheme.website}`,

      hi: `**${scheme.name} - पूरी जानकारी**

**उद्देश्य:** ${scheme.objective}

**पात्रता:** ${scheme.eligibility}

**लाभ:** ${scheme.benefits}

**आवश्यक दस्तावेज:** ${scheme.documents}

**आवेदन प्रक्रिया:** ${scheme.procedure}

**संपर्क जानकारी:** ${scheme.contact}
**आधिकारिक वेबसाइट:** ${scheme.website}`,

      ta: `**${scheme.name} - முழு தகவல்**

**நோக்கம்:** ${scheme.objective}

**தகுதி:** ${scheme.eligibility}

**நன்மைகள்:** ${scheme.benefits}

**தேவையான ஆவணங்கள்:** ${scheme.documents}

**விண்ணப்ப நடைமுறை:** ${scheme.procedure}

**தொடர்பு தகவல்:** ${scheme.contact}
**அதிகாரப்பூர்வ வலைத்தளம்:** ${scheme.website}`
    };

    return responses[language] || responses.en;
  }

  /**
   * Get localized messages
   */
  getLocalizedMessage(key, language) {
    const messages = {
      no_schemes_found: {
        en: "I couldn't find any relevant government schemes for your query. Please try rephrasing your question or contact our support team.",
        hi: "मैं आपके प्रश्न के लिए कोई प्रासंगिक सरकारी योजना नहीं खोज सका। कृपया अपना प्रश्न फिर से लिखने का प्रयास करें या हमारी सहायता टीम से संपर्क करें।",
        ta: "உங்கள் கேள்விக்கு தொடர்புடைய அரசு திட்டங்களை என்னால் கண்டுபிடிக்க முடியவில்லை. தயவுசெய்து உங்கள் கேள்வியை மீண்டும் எழுத முயற்சிக்கவும் அல்லது எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளவும்।"
      }
    };

    return messages[key][language] || messages[key].en;
  }

  /**
   * Generate fallback response
   */
  generateFallbackResponse(language) {
    const responses = {
      en: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.",
      hi: "मैं क्षमा चाहता हूं, लेकिन मुझे आपके अनुरोध को संसाधित करने में कठिनाई हो रही है। कृपया बाद में पुनः प्रयास करें या हमारी सहायता टीम से संपर्क करें।",
      ta: "மன்னிக்கவும், ஆனால் உங்கள் கோरிக்கையை இப்போது செயல்படுத்துவதில் எனக்கு சிக்கல் உள்ளது। தயவுசெய்து பிறகு மீண்டும் முயற்சிக்கவும் அல்லது எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளவும்।"
    };

    return responses[language] || responses.en;
  }

  /**
   * Check if service is healthy
   */
  async checkHealth() {
    return true; // Simple service is always healthy
  }
}

module.exports = SimpleLocalLLMService;
