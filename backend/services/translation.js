const axios = require('axios');

// Language codes mapping
const LANGUAGE_CODES = {
  'en': 'en',
  'hi': 'hi',
  'ta': 'ta',
  'hindi': 'hi',
  'tamil': 'ta',
  'english': 'en'
};

/**
 * Translate text using Google Translate API
 */
async function translateText(text, sourceLang, targetLang) {
  try {
    // Normalize language codes
    const source = LANGUAGE_CODES[sourceLang.toLowerCase()] || sourceLang;
    const target = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang;
    
    // If source and target are the same, return original text
    if (source === target) {
      return text;
    }
    
    // Check if API key is available
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      console.warn('⚠️ Google Translate API key not found, using fallback translation');
      return fallbackTranslation(text, source, target);
    }
    
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: source,
        target: target,
        format: 'text'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.data && response.data.data.translations) {
      return response.data.data.translations[0].translatedText;
    }
    
    throw new Error('Invalid response from Google Translate API');
    
  } catch (error) {
    console.error('❌ Translation error:', error.message);
    
    // Fallback to simple translation
    return fallbackTranslation(text, sourceLang, targetLang);
  }
}

/**
 * Fallback translation using predefined mappings
 */
function fallbackTranslation(text, sourceLang, targetLang) {
  const source = LANGUAGE_CODES[sourceLang.toLowerCase()] || sourceLang;
  const target = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang;
  
  // Simple fallback translations for common terms
  const translations = {
    'en-hi': {
      'government scheme': 'सरकारी योजना',
      'agriculture': 'कृषि',
      'employment': 'रोजगार',
      'housing': 'आवास',
      'education': 'शिक्षा',
      'health': 'स्वास्थ्य',
      'benefits': 'लाभ',
      'eligibility': 'पात्रता',
      'application': 'आवेदन',
      'documents': 'दस्तावेज',
      'contact': 'संपर्क',
      'website': 'वेबसाइट',
      'helpline': 'हेल्पलाइन',
      'farmer': 'किसान',
      'rural': 'ग्रामीण',
      'urban': 'शहरी',
      'income': 'आय',
      'support': 'सहायता',
      'loan': 'ऋण',
      'subsidy': 'सब्सिडी'
    },
    'en-ta': {
      'government scheme': 'அரசு திட்டம்',
      'agriculture': 'விவசாயம்',
      'employment': 'வேலைவாய்ப்பு',
      'housing': 'வீடு',
      'education': 'கல்வி',
      'health': 'சுகாதாரம்',
      'benefits': 'நன்மைகள்',
      'eligibility': 'தகுதி',
      'application': 'விண்ணப்பம்',
      'documents': 'ஆவணங்கள்',
      'contact': 'தொடர்பு',
      'website': 'வலைத்தளம்',
      'helpline': 'உதவி வரி',
      'farmer': 'விவசாயி',
      'rural': 'கிராமப்புற',
      'urban': 'நகர்ப்புற',
      'income': 'வருமானம்',
      'support': 'ஆதரவு',
      'loan': 'கடன்',
      'subsidy': 'மானியம்'
    },
    'hi-en': {
      'सरकारी योजना': 'government scheme',
      'कृषि': 'agriculture',
      'रोजगार': 'employment',
      'आवास': 'housing',
      'शिक्षा': 'education',
      'स्वास्थ्य': 'health',
      'लाभ': 'benefits',
      'पात्रता': 'eligibility',
      'आवेदन': 'application',
      'दस्तावेज': 'documents',
      'संपर्क': 'contact',
      'वेबसाइट': 'website',
      'हेल्पलाइन': 'helpline',
      'किसान': 'farmer',
      'ग्रामीण': 'rural',
      'शहरी': 'urban',
      'आय': 'income',
      'सहायता': 'support',
      'ऋण': 'loan',
      'सब्सिडी': 'subsidy'
    },
    'ta-en': {
      'அரசு திட்டம்': 'government scheme',
      'விவசாயம்': 'agriculture',
      'வேலைவாய்ப்பு': 'employment',
      'வீடு': 'housing',
      'கல்வி': 'education',
      'சுகாதாரம்': 'health',
      'நன்மைகள்': 'benefits',
      'தகுதி': 'eligibility',
      'விண்ணப்பம்': 'application',
      'ஆவணங்கள்': 'documents',
      'தொடர்பு': 'contact',
      'வலைத்தளம்': 'website',
      'உதவி வரி': 'helpline',
      'விவசாயி': 'farmer',
      'கிராமப்புற': 'rural',
      'நகர்ப்புற': 'urban',
      'வருமானம்': 'income',
      'ஆதரவு': 'support',
      'கடன்': 'loan',
      'மானியம்': 'subsidy'
    }
  };
  
  const translationKey = `${source}-${target}`;
  const translationMap = translations[translationKey];
  
  if (!translationMap) {
    return text; // Return original text if no translation available
  }
  
  // Simple word-by-word translation
  let translatedText = text;
  Object.entries(translationMap).forEach(([original, translated]) => {
    const regex = new RegExp(original, 'gi');
    translatedText = translatedText.replace(regex, translated);
  });
  
  return translatedText;
}

/**
 * Detect language of the input text
 */
function detectLanguage(text) {
  // Simple language detection based on character sets
  const hindiRegex = /[\u0900-\u097F]/;
  const tamilRegex = /[\u0B80-\u0BFF]/;
  
  if (hindiRegex.test(text)) {
    return 'hi';
  } else if (tamilRegex.test(text)) {
    return 'ta';
  } else {
    return 'en';
  }
}

/**
 * Get supported languages
 */
function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ];
}

/**
 * Translate multiple texts in batch
 */
async function translateBatch(texts, sourceLang, targetLang) {
  try {
    const translations = await Promise.all(
      texts.map(text => translateText(text, sourceLang, targetLang))
    );
    return translations;
  } catch (error) {
    console.error('❌ Batch translation error:', error);
    return texts; // Return original texts if translation fails
  }
}

/**
 * Translate scheme data to target language
 */
async function translateSchemeData(scheme, targetLang) {
  try {
    if (targetLang === 'en') {
      return scheme; // Already in English
    }
    
    const translatedScheme = { ...scheme };
    
    // Translate main fields
    const fieldsToTranslate = [
      'name', 'objective', 'benefits', 'deadline', 'contactInfo'
    ];
    
    for (const field of fieldsToTranslate) {
      if (scheme[field]) {
        translatedScheme[field] = await translateText(scheme[field], 'en', targetLang);
      }
    }
    
    // Translate arrays
    const arrayFieldsToTranslate = [
      'eligibility', 'documentsRequired', 'applicationProcedure'
    ];
    
    for (const field of arrayFieldsToTranslate) {
      if (scheme[field] && Array.isArray(scheme[field])) {
        translatedScheme[field] = await translateBatch(scheme[field], 'en', targetLang);
      }
    }
    
    return translatedScheme;
    
  } catch (error) {
    console.error('❌ Scheme translation error:', error);
    return scheme; // Return original scheme if translation fails
  }
}

module.exports = {
  translateText,
  detectLanguage,
  getSupportedLanguages,
  translateBatch,
  translateSchemeData
};
