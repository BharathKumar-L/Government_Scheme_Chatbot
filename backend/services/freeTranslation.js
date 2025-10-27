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
 * LibreTranslate API (Free)
 * You can use public instances or self-host
 */
const LIBRETRANSLATE_URLS = [
  'https://libretranslate.de/translate', // Public instance
  'https://translate.argosopentech.com/translate', // Another public instance
  'https://libretranslate.com/translate' // Main public instance
];

/**
 * MyMemory API (Free with rate limits)
 */
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

/**
 * Translate using LibreTranslate (Free)
 */
async function translateWithLibreTranslate(text, sourceLang, targetLang) {
  for (const url of LIBRETRANSLATE_URLS) {
    try {
      const response = await axios.post(url, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      }
    } catch (error) {
      console.warn(`LibreTranslate URL ${url} failed:`, error.message);
      continue;
    }
  }
  throw new Error('All LibreTranslate instances failed');
}

/**
 * Translate using MyMemory API (Free)
 */
async function translateWithMyMemory(text, sourceLang, targetLang) {
  try {
    const response = await axios.get(MYMEMORY_URL, {
      params: {
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      },
      timeout: 5000
    });

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    throw new Error('Invalid response from MyMemory API');
  } catch (error) {
    throw new Error(`MyMemory API failed: ${error.message}`);
  }
}

/**
 * Enhanced fallback translation with more comprehensive mappings
 */
function enhancedFallbackTranslation(text, sourceLang, targetLang) {
  const source = LANGUAGE_CODES[sourceLang.toLowerCase()] || sourceLang;
  const target = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang;
  
  // Comprehensive translation mappings
  const translations = {
    'en-hi': {
      // Government schemes
      'government scheme': 'सरकारी योजना',
      'central scheme': 'केंद्रीय योजना',
      'state scheme': 'राज्य योजना',
      'central government': 'केंद्र सरकार',
      'state government': 'राज्य सरकार',
      
      // Categories
      'agriculture': 'कृषि',
      'employment': 'रोजगार',
      'housing': 'आवास',
      'education': 'शिक्षा',
      'health': 'स्वास्थ्य',
      'welfare': 'कल्याण',
      'social security': 'सामाजिक सुरक्षा',
      'rural development': 'ग्रामीण विकास',
      'urban development': 'शहरी विकास',
      
      // Benefits and terms
      'benefits': 'लाभ',
      'eligibility': 'पात्रता',
      'application': 'आवेदन',
      'documents': 'दस्तावेज',
      'contact': 'संपर्क',
      'website': 'वेबसाइट',
      'helpline': 'हेल्पलाइन',
      'support': 'सहायता',
      'assistance': 'सहायता',
      'subsidy': 'सब्सिडी',
      'loan': 'ऋण',
      'grant': 'अनुदान',
      'scholarship': 'छात्रवृत्ति',
      'pension': 'पेंशन',
      'allowance': 'भत्ता',
      
      // People and places
      'farmer': 'किसान',
      'rural': 'ग्रामीण',
      'urban': 'शहरी',
      'family': 'परिवार',
      'household': 'घर',
      'women': 'महिलाएं',
      'children': 'बच्चे',
      'senior citizens': 'वरिष्ठ नागरिक',
      'disabled': 'विकलांग',
      'minority': 'अल्पसंख्यक',
      'tribal': 'आदिवासी',
      
      // Financial terms
      'income': 'आय',
      'salary': 'वेतन',
      'wage': 'मजदूरी',
      'money': 'पैसा',
      'rupees': 'रुपये',
      'lakh': 'लाख',
      'crore': 'करोड़',
      'per year': 'प्रति वर्ष',
      'per month': 'प्रति माह',
      'per day': 'प्रति दिन',
      
      // Time and status
      'ongoing': 'चल रहा है',
      'permanent': 'स्थायी',
      'temporary': 'अस्थायी',
      'immediate': 'तत्काल',
      'urgent': 'जरूरी',
      'deadline': 'अंतिम तिथि',
      'last date': 'अंतिम तिथि',
      'valid': 'वैध',
      'expired': 'समाप्त',
      
      // Common phrases
      'how to apply': 'कैसे आवेदन करें',
      'where to apply': 'कहां आवेदन करें',
      'when to apply': 'कब आवेदन करें',
      'who can apply': 'कौन आवेदन कर सकता है',
      'what documents': 'कौन से दस्तावेज',
      'how much benefit': 'कितना लाभ',
      'contact number': 'संपर्क नंबर',
      'email address': 'ईमेल पता',
      'postal address': 'डाक पता'
    },
    'en-ta': {
      // Government schemes
      'government scheme': 'அரசு திட்டம்',
      'central scheme': 'மத்திய திட்டம்',
      'state scheme': 'மாநில திட்டம்',
      'central government': 'மத்திய அரசு',
      'state government': 'மாநில அரசு',
      
      // Categories
      'agriculture': 'விவசாயம்',
      'employment': 'வேலைவாய்ப்பு',
      'housing': 'வீடு',
      'education': 'கல்வி',
      'health': 'சுகாதாரம்',
      'welfare': 'நலன்புரி',
      'social security': 'சமூக பாதுகாப்பு',
      'rural development': 'கிராமப்புற வளர்ச்சி',
      'urban development': 'நகர்ப்புற வளர்ச்சி',
      
      // Benefits and terms
      'benefits': 'நன்மைகள்',
      'eligibility': 'தகுதி',
      'application': 'விண்ணப்பம்',
      'documents': 'ஆவணங்கள்',
      'contact': 'தொடர்பு',
      'website': 'வலைத்தளம்',
      'helpline': 'உதவி வரி',
      'support': 'ஆதரவு',
      'assistance': 'உதவி',
      'subsidy': 'மானியம்',
      'loan': 'கடன்',
      'grant': 'நிதியுதவி',
      'scholarship': 'கல்வி உதவித்தொகை',
      'pension': 'ஓய்வூதியம்',
      'allowance': 'படி',
      
      // People and places
      'farmer': 'விவசாயி',
      'rural': 'கிராமப்புற',
      'urban': 'நகர்ப்புற',
      'family': 'குடும்பம்',
      'household': 'வீடு',
      'women': 'பெண்கள்',
      'children': 'குழந்தைகள்',
      'senior citizens': 'முதியவர்கள்',
      'disabled': 'ஊனமுற்றோர்',
      'minority': 'சிறுபான்மை',
      'tribal': 'பழங்குடி',
      
      // Financial terms
      'income': 'வருமானம்',
      'salary': 'சம்பளம்',
      'wage': 'கூலி',
      'money': 'பணம்',
      'rupees': 'ரூபாய்',
      'lakh': 'லட்சம்',
      'crore': 'கோடி',
      'per year': 'ஆண்டுக்கு',
      'per month': 'மாதத்திற்கு',
      'per day': 'நாளுக்கு',
      
      // Time and status
      'ongoing': 'நடந்து கொண்டிருக்கிறது',
      'permanent': 'நிரந்தர',
      'temporary': 'தற்காலிக',
      'immediate': 'உடனடி',
      'urgent': 'அவசர',
      'deadline': 'கடைசி தேதி',
      'last date': 'கடைசி தேதி',
      'valid': 'செல்லுபடியாகும்',
      'expired': 'காலாவதியான',
      
      // Common phrases
      'how to apply': 'எப்படி விண்ணப்பிக்க',
      'where to apply': 'எங்கே விண்ணப்பிக்க',
      'when to apply': 'எப்போது விண்ணப்பிக்க',
      'who can apply': 'யார் விண்ணப்பிக்கலாம்',
      'what documents': 'எந்த ஆவணங்கள்',
      'how much benefit': 'எவ்வளவு நன்மை',
      'contact number': 'தொடர்பு எண்',
      'email address': 'மின்னஞ்சல் முகவரி',
      'postal address': 'அஞ்சல் முகவரி'
    }
  };
  
  const translationKey = `${source}-${target}`;
  const translationMap = translations[translationKey];
  
  if (!translationMap) {
    return text; // Return original text if no translation available
  }
  
  // Enhanced word-by-word translation with better regex
  let translatedText = text;
  Object.entries(translationMap).forEach(([original, translated]) => {
    // Use word boundaries for better matching
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translatedText = translatedText.replace(regex, translated);
  });
  
  return translatedText;
}

/**
 * Main translation function with multiple fallbacks
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
    
    // Try LibreTranslate first (free)
    try {
      return await translateWithLibreTranslate(text, source, target);
    } catch (libreError) {
      console.warn('LibreTranslate failed, trying MyMemory:', libreError.message);
    }
    
    // Try MyMemory as second option (free with limits)
    try {
      return await translateWithMyMemory(text, source, target);
    } catch (myMemoryError) {
      console.warn('MyMemory failed, using fallback:', myMemoryError.message);
    }
    
    // Fallback to enhanced local translation
    return enhancedFallbackTranslation(text, source, target);
    
  } catch (error) {
    console.error('❌ Translation error:', error.message);
    return enhancedFallbackTranslation(text, sourceLang, targetLang);
  }
}

/**
 * Detect language of the input text
 */
function detectLanguage(text) {
  // Enhanced language detection
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
    return texts.map(text => enhancedFallbackTranslation(text, sourceLang, targetLang));
  }
}

module.exports = {
  translateText,
  detectLanguage,
  getSupportedLanguages,
  translateBatch,
  enhancedFallbackTranslation
};
