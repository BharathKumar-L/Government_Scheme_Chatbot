const axios = require('axios');

// Format schemes for LLM context
const formatSchemesForContext = (schemes) => {
  return schemes
    .slice(0, 3) // Use top 3 schemes
    .map((scheme, idx) => {
      return `
Scheme ${idx + 1}: ${scheme.name}
Category: ${scheme.category}
Benefits: ${scheme.benefits || 'N/A'}
Eligibility: ${scheme.eligibility || 'N/A'}
Application Process: ${scheme.applicationProcedure || 'N/A'}
Documents Needed: ${scheme.documentsRequired || 'N/A'}
`;
    })
    .join('\n---\n');
};

// Generate system prompt
const generateSystemPrompt = (language) => {
  const lang = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil'
  }[language] || 'English';

  return `You are a helpful assistant for Indian government welfare schemes.
You provide clear, accurate information about government schemes including their benefits, eligibility criteria, and application procedures.
Respond in ${lang} based on the user's language.
Be concise but informative. If you don't have information about a specific scheme, say so clearly.
Always prioritize helping users understand their eligibility and how to apply.`;
};

// Generate response using different LLM backends
const generateResponse = async (options) => {
  const {
    query,
    queryEnglish,
    retrievedSchemes,
    language = 'en',
    temperature = 0.7,
    maxTokens = 500
  } = options;

  let schemeContext = '';

  try {
    schemeContext = formatSchemesForContext(retrievedSchemes);
    const systemPrompt = generateSystemPrompt(language);

    // Try Ollama first if enabled
    if (process.env.USE_OLLAMA === 'true') {
      return await generateWithOllama({
        query: queryEnglish,
        context: schemeContext,
        systemPrompt,
        language,
        temperature,
        maxTokens
      });
    }

    // Try Hugging Face
    if (process.env.USE_HUGGINGFACE === 'true') {
      return await generateWithHuggingFace({
        query: queryEnglish,
        context: schemeContext,
        systemPrompt,
        language,
        temperature,
        maxTokens
      });
    }

    // Fallback: local simple generation
    return generateLocal({
      query: queryEnglish,
      context: schemeContext,
      retrievedSchemes,
      language
    });
  } catch (error) {
    console.error('LLM generation error:', error);
    return generateLocal({
      query: queryEnglish,
      context: schemeContext,
      retrievedSchemes,
      language
    });
  }
};

// Ollama integration
const generateWithOllama = async (options) => {
  const {
    query,
    context,
    systemPrompt,
    temperature,
    maxTokens
  } = options;

  try {
    const prompt = `${systemPrompt}

Based on the following government schemes information:
${context}

User Question: ${query}

Helpful Answer:`;

    const response = await axios.post(
      `${process.env.OLLAMA_BASE_URL}/api/generate`,
      {
        model: process.env.OLLAMA_MODEL || 'llama2',
        prompt,
        temperature,
        num_predict: maxTokens,
        stream: false
      },
      { timeout: 30000 }
    );

    return {
      text: response.data.response || 'No response generated',
      model: 'ollama'
    };
  } catch (error) {
    console.error('Ollama error:', error.message);
    throw error;
  }
};

// Hugging Face API
const generateWithHuggingFace = async (options) => {
  const {
    query,
    context,
    systemPrompt,
    maxTokens
  } = options;

  try {
    const prompt = `${systemPrompt}

Schemes Context:
${context}

Question: ${query}

Answer:`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`
        },
        timeout: 30000
      }
    );

    const generatedText = response.data[0]?.generated_text || 'No response';
    // Extract just the answer part
    const answerStart = generatedText.lastIndexOf('Answer:') + 7;
    const text = generatedText.substring(answerStart).trim();

    return {
      text: text.substring(0, maxTokens),
      model: 'huggingface'
    };
  } catch (error) {
    console.error('Hugging Face error:', error.message);
    throw error;
  }
};

// Local simple response generation
const generateLocal = (options) => {
  const {
    query,
    context,
    retrievedSchemes
  } = options;

  // Create a response by extracting relevant information from schemes
  let response = '';

  if (retrievedSchemes && retrievedSchemes.length > 0) {
    const topScheme = retrievedSchemes[0];

    // Construct response from scheme data
    response = `Based on your query, I found the following relevant scheme:\n\n`;
    response += `**${topScheme.name}**\n`;

    if (topScheme.benefits) {
      response += `\nBenefits: ${topScheme.benefits.substring(0, 300)}...\n`;
    }

    if (topScheme.eligibility) {
      response += `\nEligibility Criteria: ${topScheme.eligibility.substring(0, 300)}...\n`;
    }

    if (topScheme.applicationProcedure) {
      response += `\nHow to Apply: ${topScheme.applicationProcedure.substring(0, 300)}...\n`;
    }

    if (topScheme.documentsRequired) {
      response += `\nDocuments Required: ${topScheme.documentsRequired.substring(0, 200)}...\n`;
    }

    if (retrievedSchemes.length > 1) {
      response += `\nI also found ${retrievedSchemes.length - 1} other relevant scheme(s). Would you like to know more about them?`;
    }
  } else {
    response = `I couldn't find specific schemes matching your query. Please try asking about specific benefits, categories, or application procedures.`;
  }

  return {
    text: response,
    model: 'local'
  };
};

module.exports = {
  generateResponse,
  generateWithOllama,
  generateWithHuggingFace,
  generateLocal,
  formatSchemesForContext
};
