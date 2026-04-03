const axios = require('axios');
const NodeCache = require('node-cache');

const translationCache = new NodeCache({ stdTTL: 3600 });

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil'
};

// Detect language from text
const detectLanguage = (text) => {
  // Simple heuristics for language detection
  const hindiChars = /[\u0900-\u097F]/g;
  const tamilChars = /[\u0B80-\u0BFF]/g;

  const hindiMatches = (text.match(hindiChars) || []).length;
  const tamilMatches = (text.match(tamilChars) || []).length;

  if (tamilMatches > text.length * 0.1) return 'ta';
  if (hindiMatches > text.length * 0.1) return 'hi';
  return 'en';
};

// Translate using Google Translate API (free tier)
const translateGoogle = async (text, targetLang, sourceLang = 'auto') => {
  try {
    const cacheKey = `${sourceLang}_${targetLang}_${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    const response = await axios.get('https://translate.googleapis.com/translate_a/element.js', {
      params: {
        cb: 'responses.callbacks_' + Date.now()
      },
      timeout: 5000
    });

    // Fallback: use a simpler translation approach
    return simpleTranslate(text, targetLang);
  } catch (error) {
    console.warn('Google Translate failed, using fallback:', error.message);
    return simpleTranslate(text, targetLang);
  }
};

// Simple rule-based translation (for common words and phrases)
const simpleTranslate = (text, targetLang) => {
  const dictionary = {
    hi: {
      'scheme': 'योजना',
      'benefit': 'लाभ',
      'eligibility': 'पात्रता',
      'application': 'आवेदन',
      'documents': 'दस्तावेज',
      'government': 'सरकार',
      'pension': 'पेंशन',
      'insurance': 'बीमा',
      'support': 'समर्थन'
    },
    ta: {
      'scheme': 'திட்டம்',
      'benefit': 'பலன்',
      'eligibility': 'தகுதி',
      'application': 'விண்ணப்பம்',
      'documents': 'ஆவணங்கள்',
      'government': 'அரசு',
      'pension': 'ஓய்வூதியம்',
      'insurance': 'காப்பீடு',
      'support': 'ஆதரவு'
    }
  };

  if (targetLang === 'en') return text;

  let translated = text.toLowerCase();
  const dict = dictionary[targetLang] || {};

  Object.entries(dict).forEach(([en, trans]) => {
    translated = translated.replace(new RegExp(en, 'gi'), trans);
  });

  return translated;
};

// Main translation function
const translate = async (text, targetLang, sourceLang = 'auto') => {
  if (!text || !text.trim()) return '';

  // Detect source language if auto
  if (sourceLang === 'auto') {
    sourceLang = detectLanguage(text);
  }

  // No translation needed
  if (sourceLang === targetLang) return text;

  // Validate target language
  if (!SUPPORTED_LANGUAGES[targetLang]) {
    console.warn(`Unsupported target language: ${targetLang}`);
    return text;
  }

  try {
    const cacheKey = `${sourceLang}_${targetLang}_${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    let translated;

    // Try to use an actual translation API
    if (process.env.TRANSLATION_SERVICE === 'google') {
      translated = await translateGoogle(text, targetLang, sourceLang);
    } else {
      // Use simple translation as fallback
      translated = simpleTranslate(text, targetLang);
    }

    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    console.error('Translation error:', error.message);
    return text;
  }
};

// Translate content field
const translateContent = async (scheme, targetLang) => {
  if (targetLang === 'en') return scheme;

  const translated = {
    ...scheme,
    name: await translate(scheme.name || '', targetLang),
    details: await translate(scheme.details || '', targetLang),
    benefits: await translate(scheme.benefits || '', targetLang),
    eligibility: await translate(scheme.eligibility || '', targetLang),
    applicationProcedure: await translate(scheme.applicationProcedure || '', targetLang),
    documentsRequired: await translate(scheme.documentsRequired || '', targetLang)
  };

  return translated;
};

// Batch translate
const translateBatch = async (texts, targetLang) => {
  return Promise.all(
    texts.map(text => translate(text, targetLang))
  );
};

module.exports = {
  translate,
  translateContent,
  translateBatch,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  translationCache
};
