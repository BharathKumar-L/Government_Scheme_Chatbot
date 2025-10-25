const axios = require('axios');

class LocalLLMService {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.LOCAL_MODEL || 'llama2:7b'; // or 'mistral:7b', 'codellama:7b'
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
  }

  /**
   * Generate embeddings using local model
   */
  async generateEmbedding(text) {
    try {
      // Using Ollama for embeddings
      const response = await axios.post(`${this.baseURL}/api/embeddings`, {
        model: this.embeddingModel,
        prompt: text
      });

      return response.data.embedding;
    } catch (error) {
      console.error('❌ Local embedding generation failed:', error);
      // Fallback to simple text hashing
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Generate response using local LLM
   */
  async generateResponse(query, context, language = 'en') {
    try {
      const systemPrompt = this.createSystemPrompt(language);
      const fullPrompt = `${systemPrompt}\n\nContext:\n${context}\n\nUser Query: ${query}\n\nResponse:`;

      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
          stop: ['User Query:', 'Context:']
        }
      });

      return response.data.response.trim();
    } catch (error) {
      console.error('❌ Local LLM generation failed:', error);
      return this.generateFallbackResponse(context, language);
    }
  }

  /**
   * Create system prompt for the LLM
   */
  createSystemPrompt(language) {
    const prompts = {
      en: `You are a helpful assistant for RuralConnect, a government scheme information chatbot. 
You help citizens understand government welfare schemes in a clear, friendly, and accurate manner.

Guidelines:
- Provide accurate information based only on the context provided
- Be concise but comprehensive
- Use simple, easy-to-understand language
- If the query is not related to government schemes, politely redirect
- Always mention relevant contact information and websites
- If you don't have enough information, say so clearly

Respond in a helpful, informative manner.`,

      hi: `आप RuralConnect के लिए एक सहायक हैं, जो सरकारी योजना सूचना चैटबॉट है।
आप नागरिकों को सरकारी कल्याण योजनाओं को समझने में मदद करते हैं।

दिशानिर्देश:
- केवल प्रदान किए गए संदर्भ के आधार पर सटीक जानकारी दें
- संक्षिप्त लेकिन व्यापक रहें
- सरल, समझने में आसान भाषा का उपयोग करें
- यदि प्रश्न सरकारी योजनाओं से संबंधित नहीं है, तो विनम्रता से पुनर्निर्देशित करें
- हमेशा प्रासंगिक संपर्क जानकारी और वेबसाइटों का उल्लेख करें

सहायक, जानकारीपूर्ण तरीके से जवाब दें।`,

      ta: `நீங்கள் RuralConnect க்கான உதவியாளர், அரசு திட்ட தகவல் அரட்டை போட்.
நீங்கள் குடிமக்களுக்கு அரசு நலத்திட்டங்களைப் புரிந்துகொள்ள உதவுகிறீர்கள்.

வழிகாட்டுதல்கள்:
- வழங்கப்பட்ட சூழலின் அடிப்படையில் மட்டுமே துல்லியமான தகவலை வழங்குங்கள்
- சுருக்கமாக ஆனால் விரிவாக இருங்கள்
- எளிய, புரிந்துகொள்ள எளிதான மொழியைப் பயன்படுத்துங்கள்
- கேள்வி அரசு திட்டங்களுடன் தொடர்புடையதாக இல்லாவிட்டால், மரியாதையுடன் மறுவழிகாட்டுங்கள்
- எப்போதும் தொடர்புடைய தொடர்பு தகவல் மற்றும் வலைத்தளங்களைக் குறிப்பிடுங்கள்

உதவியான, தகவலறிந்த முறையில் பதிலளிக்கவும்।`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Generate fallback response when LLM fails
   */
  generateFallbackResponse(context, language) {
    const fallbackMessages = {
      en: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.",
      hi: "मैं क्षमा चाहता हूं, लेकिन मुझे आपके अनुरोध को संसाधित करने में कठिनाई हो रही है। कृपया बाद में पुनः प्रयास करें या हमारी सहायता टीम से संपर्क करें।",
      ta: "மன்னிக்கவும், ஆனால் உங்கள் கோரிக்கையை இப்போது செயல்படுத்துவதில் எனக்கு சிக்கல் உள்ளது. தயவுசெய்து பிறகு மீண்டும் முயற்சிக்கவும் அல்லது எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளவும்।"
    };

    return fallbackMessages[language] || fallbackMessages.en;
  }

  /**
   * Simple embedding fallback for development
   */
  generateSimpleEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding size
    
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
   * Check if Ollama is running
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ Ollama is not running:', error.message);
      return false;
    }
  }

  /**
   * Pull required models
   */
  async pullModels() {
    try {
      console.log('📥 Pulling required models...');
      
      // Pull LLM model
      await axios.post(`${this.baseURL}/api/pull`, {
        name: this.model
      });
      
      // Pull embedding model
      await axios.post(`${this.baseURL}/api/pull`, {
        name: this.embeddingModel
      });
      
      console.log('✅ Models pulled successfully');
    } catch (error) {
      console.error('❌ Failed to pull models:', error);
    }
  }
}

module.exports = LocalLLMService;
