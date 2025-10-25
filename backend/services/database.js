const fs = require('fs').promises;
const path = require('path');

// In-memory database for development
// In production, this would be replaced with MongoDB or PostgreSQL
let schemesDatabase = [];
let userQueries = [];

const DATA_DIR = path.join(__dirname, '../data');
const SCHEMES_FILE = path.join(DATA_DIR, 'schemes.json');
const SCRAPED_SCHEMES_FILE = path.join(DATA_DIR, 'scraped_schemes.json');
const QUERIES_FILE = path.join(DATA_DIR, 'user_queries.json');

/**
 * Initialize the database with government schemes
 */
async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Try to load scraped data first, then fallback to sample data
    try {
      const scrapedData = await fs.readFile(SCRAPED_SCHEMES_FILE, 'utf8');
      schemesDatabase = JSON.parse(scrapedData);
      console.log(`📚 Loaded ${schemesDatabase.length} schemes from scraped data`);
    } catch (error) {
      console.log('⚠️ No scraped data found, trying sample data...');
      
      try {
        const schemesData = await fs.readFile(SCHEMES_FILE, 'utf8');
        schemesDatabase = JSON.parse(schemesData);
        console.log(`📚 Loaded ${schemesDatabase.length} schemes from sample database`);
      } catch (sampleError) {
        console.log('📝 Creating sample schemes database...');
        await createSampleSchemes();
      }
    }
    
    try {
      const queriesData = await fs.readFile(QUERIES_FILE, 'utf8');
      userQueries = JSON.parse(queriesData);
    } catch (error) {
      userQueries = [];
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create sample government schemes data
 */
async function createSampleSchemes() {
  const sampleSchemes = [
    {
      id: 'pm-kisan-1',
      name: 'PM Kisan Samman Nidhi',
      nameHindi: 'पीएम किसान सम्मान निधि',
      nameTamil: 'பி.எம். கிசான் சம்மான் நிதி',
      category: 'Agriculture',
      categoryHindi: 'कृषि',
      categoryTamil: 'விவசாயம்',
      objective: 'To provide income support to all landholding farmers families in the country',
      objectiveHindi: 'देश के सभी भूमिधारक किसान परिवारों को आय सहायता प्रदान करना',
      objectiveTamil: 'நாட்டின் அனைத்து நில உரிமையாளர் விவசாயி குடும்பங்களுக்கும் வருமான ஆதரவு வழங்க',
      eligibility: [
        'All landholding farmers families',
        'Small and marginal farmers',
        'Family should have cultivable land'
      ],
      eligibilityHindi: [
        'सभी भूमिधारक किसान परिवार',
        'छोटे और सीमांत किसान',
        'परिवार के पास खेती योग्य भूमि होनी चाहिए'
      ],
      eligibilityTamil: [
        'அனைத்து நில உரிமையாளர் விவசாயி குடும்பங்கள்',
        'சிறிய மற்றும் விளிம்பு விவசாயிகள்',
        'குடும்பத்திற்கு விவசாயம் செய்யக்கூடிய நிலம் இருக்க வேண்டும்'
      ],
      documentsRequired: [
        'Land records',
        'Aadhaar card',
        'Bank account details',
        'Mobile number'
      ],
      documentsRequiredHindi: [
        'भूमि रिकॉर्ड',
        'आधार कार्ड',
        'बैंक खाता विवरण',
        'मोबाइल नंबर'
      ],
      documentsRequiredTamil: [
        'நில பதிவுகள்',
        'ஆதார் அட்டை',
        'வங்கி கணக்கு விவரங்கள்',
        'மொபைல் எண்'
      ],
      applicationProcedure: [
        'Visit nearest Common Service Centre (CSC)',
        'Submit required documents',
        'Fill the application form',
        'Get application receipt'
      ],
      applicationProcedureHindi: [
        'निकटतम कॉमन सर्विस सेंटर (CSC) पर जाएं',
        'आवश्यक दस्तावेज जमा करें',
        'आवेदन पत्र भरें',
        'आवेदन रसीद प्राप्त करें'
      ],
      applicationProcedureTamil: [
        'அருகிலுள்ள பொது சேவை மையத்திற்குச் செல்லுங்கள்',
        'தேவையான ஆவணங்களை சமர்ப்பிக்கவும்',
        'விண்ணப்ப படிவத்தை நிரப்பவும்',
        'விண்ணப்ப ரசீதைப் பெறவும்'
      ],
      benefits: '₹6,000 per year in three equal installments of ₹2,000 each',
      benefitsHindi: 'प्रति वर्ष ₹6,000 तीन समान किस्तों में ₹2,000 प्रत्येक',
      benefitsTamil: 'ஆண்டுக்கு ₹6,000 மூன்று சமமான தவணைகளில் ₹2,000 ஒவ்வொன்றும்',
      deadline: 'Ongoing',
      deadlineHindi: 'चल रहा है',
      deadlineTamil: 'நடந்து கொண்டிருக்கிறது',
      contactInfo: 'PM-KISAN Helpline: 1800-180-1551',
      contactInfoHindi: 'पीएम-किसान हेल्पलाइन: 1800-180-1551',
      contactInfoTamil: 'பி.எம்.-கிசான் உதவி வரி: 1800-180-1551',
      website: 'https://pmkisan.gov.in',
      lastUpdated: new Date().toISOString(),
      tags: ['agriculture', 'farmer', 'income support', 'pm kisan']
    },
    {
      id: 'mgnrega-2',
      name: 'Mahatma Gandhi National Rural Employment Guarantee Act',
      nameHindi: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम',
      nameTamil: 'மகாத்மா காந்தி தேசிய கிராமப்புற வேலைவாய்ப்பு உத்தரவாத சட்டம்',
      category: 'Employment',
      categoryHindi: 'रोजगार',
      categoryTamil: 'வேலைவாய்ப்பு',
      objective: 'To provide at least 100 days of guaranteed wage employment in a financial year to every rural household',
      objectiveHindi: 'प्रत्येक ग्रामीण परिवार को एक वित्तीय वर्ष में कम से कम 100 दिनों की गारंटीकृत मजदूरी रोजगार प्रदान करना',
      objectiveTamil: 'ஒவ்வொரு கிராமப்புற குடும்பத்திற்கும் ஒரு நிதியாண்டில் குறைந்தது 100 நாட்கள் உத்தரவாத ஊதிய வேலைவாய்ப்பு வழங்க',
      eligibility: [
        'Adult members of rural households',
        'Willing to do unskilled manual work',
        'Should be registered in the job card'
      ],
      eligibilityHindi: [
        'ग्रामीण परिवारों के वयस्क सदस्य',
        'अकुशल शारीरिक कार्य करने के लिए तैयार',
        'जॉब कार्ड में पंजीकृत होना चाहिए'
      ],
      eligibilityTamil: [
        'கிராமப்புற குடும்பங்களின் வயது வந்த உறுப்பினர்கள்',
        'திறமையற்ற கைவினை வேலை செய்ய தயாராக இருக்க வேண்டும்',
        'வேலை அட்டையில் பதிவு செய்யப்பட்டிருக்க வேண்டும்'
      ],
      documentsRequired: [
        'Job card',
        'Aadhaar card',
        'Bank account details'
      ],
      documentsRequiredHindi: [
        'जॉब कार्ड',
        'आधार कार्ड',
        'बैंक खाता विवरण'
      ],
      documentsRequiredTamil: [
        'வேலை அட்டை',
        'ஆதார் அட்டை',
        'வங்கி கணக்கு விவரங்கள்'
      ],
      applicationProcedure: [
        'Apply for job card at Gram Panchayat',
        'Submit required documents',
        'Get job card issued',
        'Demand work from Gram Panchayat'
      ],
      applicationProcedureHindi: [
        'ग्राम पंचायत में जॉब कार्ड के लिए आवेदन करें',
        'आवश्यक दस्तावेज जमा करें',
        'जॉब कार्ड जारी कराएं',
        'ग्राम पंचायत से काम की मांग करें'
      ],
      applicationProcedureTamil: [
        'கிராம பஞ்சாயத்தில் வேலை அட்டைக்கு விண்ணப்பிக்கவும்',
        'தேவையான ஆவணங்களை சமர்ப்பிக்கவும்',
        'வேலை அட்டை வழங்கப்படுகிறது',
        'கிராம பஞ்சாயத்திடமிருந்து வேலை கோரவும்'
      ],
      benefits: 'Minimum wage as per state rates (₹200-₹350 per day)',
      benefitsHindi: 'राज्य दरों के अनुसार न्यूनतम मजदूरी (₹200-₹350 प्रति दिन)',
      benefitsTamil: 'மாநில விகிதங்களின்படி குறைந்தபட்ச ஊதியம் (₹200-₹350 ஒரு நாளுக்கு)',
      deadline: 'Ongoing',
      deadlineHindi: 'चल रहा है',
      deadlineTamil: 'நடந்து கொண்டிருக்கிறது',
      contactInfo: 'MGNREGA Helpline: 1800-345-3240',
      contactInfoHindi: 'मनरेगा हेल्पलाइन: 1800-345-3240',
      contactInfoTamil: 'மன்ரேகா உதவி வரி: 1800-345-3240',
      website: 'https://nrega.nic.in',
      lastUpdated: new Date().toISOString(),
      tags: ['employment', 'rural', 'mgnrega', 'job guarantee']
    },
    {
      id: 'pradhan-mantri-awas-yojana-3',
      name: 'Pradhan Mantri Awas Yojana (PMAY)',
      nameHindi: 'प्रधानमंत्री आवास योजना',
      nameTamil: 'பிரதமர் அவாஸ் யோஜனா',
      category: 'Housing',
      categoryHindi: 'आवास',
      categoryTamil: 'வீடு',
      objective: 'To provide affordable housing to the urban and rural poor',
      objectiveHindi: 'शहरी और ग्रामीण गरीबों को किफायती आवास प्रदान करना',
      objectiveTamil: 'நகர்ப்புற மற்றும் கிராமப்புற ஏழைகளுக்கு மலிவு வீடு வழங்க',
      eligibility: [
        'Economically Weaker Section (EWS)',
        'Lower Income Group (LIG)',
        'Middle Income Group (MIG)',
        'Beneficiary should not own a pucca house'
      ],
      eligibilityHindi: [
        'आर्थिक रूप से कमजोर वर्ग (EWS)',
        'निम्न आय समूह (LIG)',
        'मध्यम आय समूह (MIG)',
        'लाभार्थी के पास पक्का मकान नहीं होना चाहिए'
      ],
      eligibilityTamil: [
        'பொருளாதார ரீதியாக பலவீனமான பிரிவு (EWS)',
        'குறைந்த வருமான குழு (LIG)',
        'நடுத்தர வருமான குழு (MIG)',
        'பயனாளிக்கு கெட்டி வீடு இருக்கக்கூடாது'
      ],
      documentsRequired: [
        'Aadhaar card',
        'Income certificate',
        'Caste certificate (if applicable)',
        'Bank account details',
        'Land documents'
      ],
      documentsRequiredHindi: [
        'आधार कार्ड',
        'आय प्रमाण पत्र',
        'जाति प्रमाण पत्र (यदि लागू हो)',
        'बैंक खाता विवरण',
        'भूमि दस्तावेज'
      ],
      documentsRequiredTamil: [
        'ஆதார் அட்டை',
        'வருமான சான்றிதழ்',
        'சாதி சான்றிதழ் (பொருந்தினால்)',
        'வங்கி கணக்கு விவரங்கள்',
        'நில ஆவணங்கள்'
      ],
      applicationProcedure: [
        'Visit nearest CSC or Municipal Corporation',
        'Submit application with required documents',
        'Get application number',
        'Wait for approval and sanction'
      ],
      applicationProcedureHindi: [
        'निकटतम CSC या नगर निगम पर जाएं',
        'आवश्यक दस्तावेजों के साथ आवेदन जमा करें',
        'आवेदन संख्या प्राप्त करें',
        'अनुमोदन और स्वीकृति की प्रतीक्षा करें'
      ],
      applicationProcedureTamil: [
        'அருகிலுள்ள CSC அல்லது மாநகராட்சிக்குச் செல்லுங்கள்',
        'தேவையான ஆவணங்களுடன் விண்ணப்பத்தை சமர்ப்பிக்கவும்',
        'விண்ணப்ப எண்ணைப் பெறவும்',
        'அனுமதி மற்றும் ஒப்புதலுக்காக காத்திருக்கவும்'
      ],
      benefits: 'Up to ₹2.5 lakh for EWS/LIG and ₹6 lakh for MIG',
      benefitsHindi: 'EWS/LIG के लिए ₹2.5 लाख तक और MIG के लिए ₹6 लाख तक',
      benefitsTamil: 'EWS/LIG க்கு ₹2.5 லட்சம் வரை மற்றும் MIG க்கு ₹6 லட்சம் வரை',
      deadline: 'March 2024',
      deadlineHindi: 'मार्च 2024',
      deadlineTamil: 'மார்ச் 2024',
      contactInfo: 'PMAY Helpline: 1800-11-6163',
      contactInfoHindi: 'पीएमएवाई हेल्पलाइन: 1800-11-6163',
      contactInfoTamil: 'பி.எம்.ஏ.வை உதவி வரி: 1800-11-6163',
      website: 'https://pmaymis.gov.in',
      lastUpdated: new Date().toISOString(),
      tags: ['housing', 'pmay', 'affordable housing', 'urban', 'rural']
    }
  ];
  
  schemesDatabase = sampleSchemes;
  await saveSchemesToFile();
  console.log(`✅ Created ${schemesDatabase.length} sample schemes`);
}

/**
 * Save schemes to file
 */
async function saveSchemesToFile() {
  try {
    await fs.writeFile(SCHEMES_FILE, JSON.stringify(schemesDatabase, null, 2));
  } catch (error) {
    console.error('❌ Failed to save schemes to file:', error);
  }
}

/**
 * Save user queries to file
 */
async function saveQueriesToFile() {
  try {
    await fs.writeFile(QUERIES_FILE, JSON.stringify(userQueries, null, 2));
  } catch (error) {
    console.error('❌ Failed to save queries to file:', error);
  }
}

/**
 * Get all schemes
 */
function getAllSchemes() {
  return schemesDatabase;
}

/**
 * Get scheme by ID
 */
function getSchemeById(id) {
  return schemesDatabase.find(scheme => scheme.id === id);
}

/**
 * Search schemes by query
 */
function searchSchemes(query, language = 'en') {
  const searchTerm = query.toLowerCase();
  
  return schemesDatabase.filter(scheme => {
    const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
    const objectiveField = language === 'hi' ? 'objectiveHindi' : language === 'ta' ? 'objectiveTamil' : 'objective';
    const categoryField = language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category';
    
    return (
      scheme[nameField]?.toLowerCase().includes(searchTerm) ||
      scheme[objectiveField]?.toLowerCase().includes(searchTerm) ||
      scheme[categoryField]?.toLowerCase().includes(searchTerm) ||
      scheme.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
}

/**
 * Get schemes by category
 */
function getSchemesByCategory(category, language = 'en') {
  const categoryField = language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category';
  return schemesDatabase.filter(scheme => 
    scheme[categoryField]?.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Add user query
 */
async function addUserQuery(query, response, language = 'en') {
  const userQuery = {
    id: Date.now().toString(),
    query,
    response,
    language,
    timestamp: new Date().toISOString()
  };
  
  userQueries.push(userQuery);
  await saveQueriesToFile();
  return userQuery;
}

/**
 * Get user queries
 */
function getUserQueries(limit = 50) {
  return userQueries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

module.exports = {
  initializeDatabase,
  getAllSchemes,
  getSchemeById,
  searchSchemes,
  getSchemesByCategory,
  addUserQuery,
  getUserQueries
};
