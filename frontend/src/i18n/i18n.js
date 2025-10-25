import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        chat: 'Chat',
        schemes: 'Schemes',
        about: 'About'
      },
      
      // Chat
      chat: {
        title: 'Government Schemes Chatbot',
        subtitle: 'Ask questions about government welfare schemes in your preferred language',
        welcome: 'Hello! I\'m your government schemes assistant. I can help you find information about various welfare schemes. What would you like to know?',
        inputPlaceholder: 'Ask about government schemes...',
        voiceInput: 'Voice Input',
        voiceOutput: 'Voice Output',
        sessionId: 'Session',
        error: 'Sorry, I couldn\'t process your request. Please try again.',
        thinking: 'Thinking...'
      },
      
      // Schemes
      schemes: {
        title: 'Government Schemes',
        subtitle: 'Browse and search through available government welfare schemes',
        searchPlaceholder: 'Search schemes...',
        selectCategory: 'Select Category',
        allCategories: 'All Categories',
        viewDetails: 'View Details',
        noResults: 'No schemes found',
        noResultsDescription: 'Try adjusting your search terms or browse different categories.',
        objective: 'Objective',
        eligibility: 'Eligibility',
        benefits: 'Benefits',
        documentsRequired: 'Documents Required',
        applicationProcedure: 'Application Procedure',
        deadline: 'Deadline',
        contactInfo: 'Contact Information',
        visitWebsite: 'Visit Official Website'
      },
      
      // About
      about: {
        title: 'About RuralConnect',
        subtitle: 'Bridging the gap between citizens and government welfare schemes',
        mission: {
          title: 'Our Mission',
          description: 'To make government welfare schemes accessible to every citizen, regardless of language barriers, digital literacy, or connectivity issues. We believe that information about government benefits should be available to everyone, especially those in rural and underserved areas.'
        },
        features: {
          title: 'Key Features',
          chatbot: {
            title: 'AI-Powered Chatbot',
            description: 'Get instant, accurate answers about government schemes using advanced RAG technology.'
          },
          multilingual: {
            title: 'Multilingual Support',
            description: 'Available in English, Hindi, and Tamil with more languages coming soon.'
          },
          voice: {
            title: 'Voice Interaction',
            description: 'Speak your questions and listen to responses in your preferred language.'
          },
          offline: {
            title: 'Offline Support',
            description: 'Access previously viewed schemes even without internet connection.'
          },
          secure: {
            title: 'Secure & Private',
            description: 'Your data is protected with enterprise-grade security measures.'
          },
          accessibility: {
            title: 'Accessibility First',
            description: 'Designed for users with varying levels of digital literacy and abilities.'
          }
        },
        stats: {
          title: 'Platform Statistics',
          schemes: 'Government Schemes',
          languages: 'Languages',
          categories: 'Categories',
          users: 'Active Users'
        },
        howItWorks: {
          title: 'How It Works',
          step1: {
            title: 'Ask Your Question',
            description: 'Type or speak your question about government schemes in your preferred language.'
          },
          step2: {
            title: 'AI Processing',
            description: 'Our RAG system finds relevant information from the comprehensive database of schemes.'
          },
          step3: {
            title: 'Get Your Answer',
            description: 'Receive detailed, accurate information with contact details and application procedures.'
          }
        },
        technology: {
          title: 'Technology Stack',
          frontend: 'Frontend',
          backend: 'Backend'
        },
        contact: {
          title: 'Contact Us',
          description: 'Have questions or need support? We\'re here to help!',
          email: 'Email',
          helpline: 'Helpline',
          website: 'Website'
        }
      },
      
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        retry: 'Retry',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        clear: 'Clear',
        apply: 'Apply',
        reset: 'Reset'
      }
    }
  },
  
  hi: {
    translation: {
      // Navigation
      nav: {
        chat: 'चैट',
        schemes: 'योजनाएं',
        about: 'के बारे में'
      },
      
      // Chat
      chat: {
        title: 'सरकारी योजना चैटबॉट',
        subtitle: 'अपनी पसंदीदा भाषा में सरकारी कल्याण योजनाओं के बारे में प्रश्न पूछें',
        welcome: 'नमस्ते! मैं आपका सरकारी योजना सहायक हूं। मैं आपको विभिन्न कल्याण योजनाओं के बारे में जानकारी खोजने में मदद कर सकता हूं। आप क्या जानना चाहते हैं?',
        inputPlaceholder: 'सरकारी योजनाओं के बारे में पूछें...',
        voiceInput: 'आवाज इनपुट',
        voiceOutput: 'आवाज आउटपुट',
        sessionId: 'सत्र',
        error: 'क्षमा करें, मैं आपका अनुरोध संसाधित नहीं कर सका। कृपया पुनः प्रयास करें।',
        thinking: 'सोच रहा हूं...'
      },
      
      // Schemes
      schemes: {
        title: 'सरकारी योजनाएं',
        subtitle: 'उपलब्ध सरकारी कल्याण योजनाओं को ब्राउज़ और खोजें',
        searchPlaceholder: 'योजनाएं खोजें...',
        selectCategory: 'श्रेणी चुनें',
        allCategories: 'सभी श्रेणियां',
        viewDetails: 'विवरण देखें',
        noResults: 'कोई योजना नहीं मिली',
        noResultsDescription: 'अपने खोज शब्दों को समायोजित करने या विभिन्न श्रेणियों को ब्राउज़ करने का प्रयास करें।',
        objective: 'उद्देश्य',
        eligibility: 'पात्रता',
        benefits: 'लाभ',
        documentsRequired: 'आवश्यक दस्तावेज',
        applicationProcedure: 'आवेदन प्रक्रिया',
        deadline: 'अंतिम तिथि',
        contactInfo: 'संपर्क जानकारी',
        visitWebsite: 'आधिकारिक वेबसाइट पर जाएं'
      },
      
      // About
      about: {
        title: 'रूरलकनेक्ट के बारे में',
        subtitle: 'नागरिकों और सरकारी कल्याण योजनाओं के बीच की खाई को पाटना',
        mission: {
          title: 'हमारा मिशन',
          description: 'भाषा की बाधाओं, डिजिटल साक्षरता या कनेक्टिविटी की समस्याओं की परवाह किए बिना, हर नागरिक के लिए सरकारी कल्याण योजनाओं को सुलभ बनाना। हम मानते हैं कि सरकारी लाभों के बारे में जानकारी सभी के लिए उपलब्ध होनी चाहिए, विशेष रूप से ग्रामीण और अविकसित क्षेत्रों में रहने वालों के लिए।'
        },
        features: {
          title: 'मुख्य विशेषताएं',
          chatbot: {
            title: 'AI-संचालित चैटबॉट',
            description: 'उन्नत RAG तकनीक का उपयोग करके सरकारी योजनाओं के बारे में तत्काल, सटीक उत्तर प्राप्त करें।'
          },
          multilingual: {
            title: 'बहुभाषी समर्थन',
            description: 'अंग्रेजी, हिंदी और तमिल में उपलब्ध, और जल्द ही और भाषाएं आ रही हैं।'
          },
          voice: {
            title: 'आवाज संवाद',
            description: 'अपनी पसंदीदा भाषा में प्रश्न बोलें और उत्तर सुनें।'
          },
          offline: {
            title: 'ऑफलाइन समर्थन',
            description: 'इंटरनेट कनेक्शन के बिना भी पहले देखी गई योजनाओं तक पहुंचें।'
          },
          secure: {
            title: 'सुरक्षित और निजी',
            description: 'आपका डेटा उद्यम-ग्रेड सुरक्षा उपायों के साथ सुरक्षित है।'
          },
          accessibility: {
            title: 'पहुंच पहले',
            description: 'विभिन्न स्तर की डिजिटल साक्षरता और क्षमताओं वाले उपयोगकर्ताओं के लिए डिज़ाइन किया गया।'
          }
        },
        stats: {
          title: 'प्लेटफॉर्म आंकड़े',
          schemes: 'सरकारी योजनाएं',
          languages: 'भाषाएं',
          categories: 'श्रेणियां',
          users: 'सक्रिय उपयोगकर्ता'
        },
        howItWorks: {
          title: 'यह कैसे काम करता है',
          step1: {
            title: 'अपना प्रश्न पूछें',
            description: 'अपनी पसंदीदा भाषा में सरकारी योजनाओं के बारे में अपना प्रश्न टाइप करें या बोलें।'
          },
          step2: {
            title: 'AI प्रसंस्करण',
            description: 'हमारी RAG प्रणाली योजनाओं के व्यापक डेटाबेस से प्रासंगिक जानकारी खोजती है।'
          },
          step3: {
            title: 'अपना उत्तर प्राप्त करें',
            description: 'संपर्क विवरण और आवेदन प्रक्रियाओं के साथ विस्तृत, सटीक जानकारी प्राप्त करें।'
          }
        },
        technology: {
          title: 'तकनीकी स्टैक',
          frontend: 'फ्रंटएंड',
          backend: 'बैकएंड'
        },
        contact: {
          title: 'हमसे संपर्क करें',
          description: 'प्रश्न हैं या सहायता चाहिए? हम यहां मदद के लिए हैं!',
          email: 'ईमेल',
          helpline: 'हेल्पलाइन',
          website: 'वेबसाइट'
        }
      },
      
      // Common
      common: {
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        retry: 'पुनः प्रयास',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        close: 'बंद करें',
        back: 'वापस',
        next: 'अगला',
        previous: 'पिछला',
        search: 'खोजें',
        filter: 'फिल्टर',
        sort: 'क्रमबद्ध करें',
        clear: 'साफ करें',
        apply: 'लागू करें',
        reset: 'रीसेट करें'
      }
    }
  },
  
  ta: {
    translation: {
      // Navigation
      nav: {
        chat: 'அரட்டை',
        schemes: 'திட்டங்கள்',
        about: 'பற்றி'
      },
      
      // Chat
      chat: {
        title: 'அரசு திட்டம் அரட்டை போட்',
        subtitle: 'உங்கள் விருப்பமான மொழியில் அரசு நலத்திட்டங்களைப் பற்றி கேள்விகள் கேளுங்கள்',
        welcome: 'வணக்கம்! நான் உங்கள் அரசு திட்ட உதவியாளர். பல்வேறு நலத்திட்டங்களைப் பற்றிய தகவல்களைக் கண்டுபிடிக்க உதவ முடியும். நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?',
        inputPlaceholder: 'அரசு திட்டங்களைப் பற்றி கேளுங்கள்...',
        voiceInput: 'குரல் உள்ளீடு',
        voiceOutput: 'குரல் வெளியீடு',
        sessionId: 'அமர்வு',
        error: 'மன்னிக்கவும், உங்கள் கோரிக்கையை செயல்படுத்த முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        thinking: 'சிந்திக்கிறேன்...'
      },
      
      // Schemes
      schemes: {
        title: 'அரசு திட்டங்கள்',
        subtitle: 'கிடைக்கும் அரசு நலத்திட்டங்களை உலாவி தேடுங்கள்',
        searchPlaceholder: 'திட்டங்களைத் தேடுங்கள்...',
        selectCategory: 'வகை தேர்ந்தெடுக்கவும்',
        allCategories: 'அனைத்து வகைகள்',
        viewDetails: 'விவரங்களைக் காண்க',
        noResults: 'திட்டங்கள் எதுவும் கிடைக்கவில்லை',
        noResultsDescription: 'உங்கள் தேடல் சொற்களை சரிசெய்யவும் அல்லது வெவ்வேறு வகைகளை உலாவவும்.',
        objective: 'நோக்கம்',
        eligibility: 'தகுதி',
        benefits: 'நன்மைகள்',
        documentsRequired: 'தேவையான ஆவணங்கள்',
        applicationProcedure: 'விண்ணப்ப நடைமுறை',
        deadline: 'கடைசி தேதி',
        contactInfo: 'தொடர்பு தகவல்',
        visitWebsite: 'அதிகாரப்பூர்வ வலைத்தளத்திற்குச் செல்லுங்கள்'
      },
      
      // About
      about: {
        title: 'ரூரல்கனெக்ட் பற்றி',
        subtitle: 'குடிமக்கள் மற்றும் அரசு நலத்திட்டங்களுக்கு இடையேயான இடைவெளியை அணைத்தல்',
        mission: {
          title: 'எங்கள் பணி',
          description: 'மொழி தடைகள், டிஜிட்டல் கல்வியறிவு அல்லது இணைப்பு பிரச்சினைகளைப் பொருட்படுத்தாமல், ஒவ்வொரு குடிமகனுக்கும் அரசு நலத்திட்டங்களை அணுகக்கூடியதாக மாற்றுதல். அரசு நன்மைகள் பற்றிய தகவல் அனைவருக்கும் கிடைக்க வேண்டும் என்று நாங்கள் நம்புகிறோம், குறிப்பாக கிராமப்புற மற்றும் பின்தங்கிய பகுதிகளில் வாழ்பவர்களுக்கு.'
        },
        features: {
          title: 'முக்கிய அம்சங்கள்',
          chatbot: {
            title: 'AI-இயக்கப்படும் அரட்டை போட்',
            description: 'மேம்பட்ட RAG தொழில்நுட்பத்தைப் பயன்படுத்தி அரசு திட்டங்களைப் பற்றி உடனடி, துல்லியமான பதில்களைப் பெறுங்கள்.'
          },
          multilingual: {
            title: 'பல மொழி ஆதரவு',
            description: 'ஆங்கிலம், இந்தி மற்றும் தமிழில் கிடைக்கிறது, மேலும் மொழிகள் விரைவில் வருகின்றன.'
          },
          voice: {
            title: 'குரல் தொடர்பு',
            description: 'உங்கள் விருப்பமான மொழியில் கேள்விகளைப் பேசுங்கள் மற்றும் பதில்களைக் கேளுங்கள்.'
          },
          offline: {
            title: 'ஆஃப்லைன் ஆதரவு',
            description: 'இணைய இணைப்பு இல்லாமல் கூட முன்பு பார்த்த திட்டங்களுக்கு அணுகவும்.'
          },
          secure: {
            title: 'பாதுகாப்பான மற்றும் தனியார்',
            description: 'உங்கள் தரவு நிறுவன-தர பாதுகாப்பு நடவடிக்கைகளுடன் பாதுகாக்கப்படுகிறது.'
          },
          accessibility: {
            title: 'அணுகல் முதலில்',
            description: 'வெவ்வேறு நிலைகளின் டிஜிட்டல் கல்வியறிவு மற்றும் திறன்களைக் கொண்ட பயனர்களுக்காக வடிவமைக்கப்பட்டது.'
          }
        },
        stats: {
          title: 'மேடை புள்ளிவிவரங்கள்',
          schemes: 'அரசு திட்டங்கள்',
          languages: 'மொழிகள்',
          categories: 'வகைகள்',
          users: 'செயலில் உள்ள பயனர்கள்'
        },
        howItWorks: {
          title: 'இது எவ்வாறு செயல்படுகிறது',
          step1: {
            title: 'உங்கள் கேள்வியைக் கேளுங்கள்',
            description: 'உங்கள் விருப்பமான மொழியில் அரசு திட்டங்களைப் பற்றி உங்கள் கேள்வியை தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்.'
          },
          step2: {
            title: 'AI செயலாக்கம்',
            description: 'எங்கள் RAG அமைப்பு திட்டங்களின் விரிவான தரவுத்தளத்திலிருந்து தொடர்புடைய தகவல்களைக் கண்டுபிடிக்கிறது.'
          },
          step3: {
            title: 'உங்கள் பதிலைப் பெறுங்கள்',
            description: 'தொடர்பு விவரங்கள் மற்றும் விண்ணப்ப நடைமுறைகளுடன் விரிவான, துல்லியமான தகவல்களைப் பெறுங்கள்.'
          }
        },
        technology: {
          title: 'தொழில்நுட்ப அடுக்கு',
          frontend: 'முன்புறம்',
          backend: 'பின்புறம்'
        },
        contact: {
          title: 'எங்களைத் தொடர்பு கொள்ளுங்கள்',
          description: 'கேள்விகள் உள்ளனவா அல்லது உதவி தேவையா? உதவிக்காக நாங்கள் இங்கே இருக்கிறோம்!',
          email: 'மின்னஞ்சல்',
          helpline: 'உதவி வரி',
          website: 'வலைத்தளம்'
        }
      },
      
      // Common
      common: {
        loading: 'ஏற்றப்படுகிறது...',
        error: 'பிழை',
        success: 'வெற்றி',
        retry: 'மீண்டும் முயற்சி',
        cancel: 'ரத்து செய்',
        save: 'சேமி',
        delete: 'நீக்கு',
        edit: 'திருத்து',
        close: 'மூடு',
        back: 'திரும்பு',
        next: 'அடுத்து',
        previous: 'முந்தைய',
        search: 'தேடு',
        filter: 'வடிகட்டு',
        sort: 'வரிசைப்படுத்து',
        clear: 'அழி',
        apply: 'பயன்படுத்து',
        reset: 'மீட்டமை'
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
