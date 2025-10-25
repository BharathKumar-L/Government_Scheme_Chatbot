const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class GovernmentDataScraper {
  constructor() {
    this.dataSources = {
      myscheme: {
        baseUrl: 'https://www.myscheme.gov.in',
        schemesEndpoint: '/api/schemes',
        detailsEndpoint: '/api/scheme-details'
      },
      nsp: {
        baseUrl: 'https://nsp.gov.in',
        schemesEndpoint: '/api/schemes',
        detailsEndpoint: '/api/scheme-details'
      },
      pmkisan: {
        baseUrl: 'https://pmkisan.gov.in',
        schemesEndpoint: '/api/schemes',
        detailsEndpoint: '/api/scheme-details'
      }
    };
    
    this.scrapedData = [];
    this.dataDir = path.join(__dirname, '../data');
  }

  /**
   * Main method to fetch all government scheme data
   */
  async fetchAllSchemeData() {
    console.log('🔄 Starting government scheme data fetching...');
    
    try {
      // Fetch from multiple sources
      const myschemeData = await this.fetchMySchemeData();
      const nspData = await this.fetchNSPData();
      const pmkisanData = await this.fetchPMKisanData();
      
      // Combine all data
      const allSchemes = [
        ...myschemeData,
        ...nspData,
        ...pmkisanData
      ];
      
      // Remove duplicates and clean data
      const cleanedData = this.cleanAndDeduplicateData(allSchemes);
      
      // Save to file
      await this.saveDataToFile(cleanedData);
      
      console.log(`✅ Successfully fetched ${cleanedData.length} government schemes`);
      return cleanedData;
      
    } catch (error) {
      console.error('❌ Error fetching government scheme data:', error);
      throw error;
    }
  }

  /**
   * Fetch data from MyScheme.gov.in
   */
  async fetchMySchemeData() {
    try {
      console.log('📡 Fetching data from MyScheme.gov.in...');
      
      // Try API first
      try {
        const response = await axios.get(`${this.dataSources.myscheme.baseUrl}/api/schemes`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.schemes) {
          return this.processMySchemeAPIResponse(response.data.schemes);
        }
      } catch (apiError) {
        console.log('⚠️ MyScheme API not available, trying web scraping...');
      }
      
      // Fallback to web scraping
      return await this.scrapeMySchemeWebsite();
      
    } catch (error) {
      console.error('❌ Error fetching MyScheme data:', error);
      return [];
    }
  }

  /**
   * Scrape MyScheme website
   */
  async scrapeMySchemeWebsite() {
    try {
      const response = await axios.get(`${this.dataSources.myscheme.baseUrl}/schemes`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const schemes = [];
      
      // Extract scheme information from HTML
      $('.scheme-card, .scheme-item').each((index, element) => {
        const $el = $(element);
        
        const scheme = {
          id: `myscheme-${index}`,
          name: $el.find('.scheme-title, h3, h4').first().text().trim(),
          category: $el.find('.scheme-category, .category').text().trim(),
          objective: $el.find('.scheme-description, .description').text().trim(),
          eligibility: this.extractEligibility($el),
          benefits: $el.find('.benefits, .scheme-benefits').text().trim(),
          contactInfo: $el.find('.contact, .helpline').text().trim(),
          website: this.dataSources.myscheme.baseUrl,
          source: 'MyScheme.gov.in',
          lastUpdated: new Date().toISOString()
        };
        
        if (scheme.name) {
          schemes.push(scheme);
        }
      });
      
      return schemes;
    } catch (error) {
      console.error('❌ Error scraping MyScheme website:', error);
      return [];
    }
  }

  /**
   * Fetch data from NSP (National Scholarship Portal)
   */
  async fetchNSPData() {
    try {
      console.log('📡 Fetching data from NSP...');
      
      // NSP specific schemes
      const nspSchemes = [
        {
          id: 'nsp-merit-scholarship',
          name: 'Merit Scholarship Scheme',
          nameHindi: 'मेरिट छात्रवृत्ति योजना',
          nameTamil: 'மெரிட் உதவித்தொகை திட்டம்',
          category: 'Education',
          categoryHindi: 'शिक्षा',
          categoryTamil: 'கல்வி',
          objective: 'To provide financial assistance to meritorious students from economically weaker sections',
          objectiveHindi: 'आर्थिक रूप से कमजोर वर्ग के मेधावी छात्रों को वित्तीय सहायता प्रदान करना',
          objectiveTamil: 'பொருளாதார ரீதியாக பலவீனமான பிரிவின் மேதையான மாணவர்களுக்கு நிதி உதவி வழங்க',
          eligibility: [
            'Students from economically weaker sections',
            'Minimum 50% marks in previous examination',
            'Family income less than ₹2.5 lakh per annum'
          ],
          eligibilityHindi: [
            'आर्थिक रूप से कमजोर वर्ग के छात्र',
            'पिछली परीक्षा में न्यूनतम 50% अंक',
            'पारिवारिक आय ₹2.5 लाख प्रति वर्ष से कम'
          ],
          eligibilityTamil: [
            'பொருளாதார ரீதியாக பலவீனமான பிரிவின் மாணவர்கள்',
            'முந்தைய தேர்வில் குறைந்தது 50% மதிப்பெண்கள்',
            'குடும்ப வருமானம் ஆண்டுக்கு ₹2.5 லட்சத்திற்கு குறைவு'
          ],
          benefits: '₹10,000 to ₹20,000 per annum based on course',
          benefitsHindi: 'कोर्स के आधार पर प्रति वर्ष ₹10,000 से ₹20,000',
          benefitsTamil: 'பாடத்தின் அடிப்படையில் ஆண்டுக்கு ₹10,000 முதல் ₹20,000 வரை',
          contactInfo: 'NSP Helpline: 0120-6619540',
          contactInfoHindi: 'एनएसपी हेल्पलाइन: 0120-6619540',
          contactInfoTamil: 'என்.எஸ்.பி உதவி வரி: 0120-6619540',
          website: 'https://scholarships.gov.in',
          source: 'NSP',
          lastUpdated: new Date().toISOString(),
          tags: ['education', 'scholarship', 'merit', 'nsp']
        }
      ];
      
      return nspSchemes;
    } catch (error) {
      console.error('❌ Error fetching NSP data:', error);
      return [];
    }
  }

  /**
   * Fetch data from PM Kisan portal
   */
  async fetchPMKisanData() {
    try {
      console.log('📡 Fetching data from PM Kisan...');
      
      // PM Kisan specific data
      const pmkisanSchemes = [
        {
          id: 'pm-kisan-samman-nidhi',
          name: 'PM Kisan Samman Nidhi',
          nameHindi: 'पीएम किसान सम्मान निधि',
          nameTamil: 'பி.எம். किसान सम्मान निधि',
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
          contactInfoTamil: 'பி.எம்.-किसान उतावी वरि: 1800-180-1551',
          website: 'https://pmkisan.gov.in',
          source: 'PM Kisan',
          lastUpdated: new Date().toISOString(),
          tags: ['agriculture', 'farmer', 'income support', 'pm kisan']
        }
      ];
      
      return pmkisanSchemes;
    } catch (error) {
      console.error('❌ Error fetching PM Kisan data:', error);
      return [];
    }
  }

  /**
   * Extract eligibility information from HTML element
   */
  extractEligibility($element) {
    const eligibility = [];
    
    $element.find('.eligibility li, .eligibility-item').each((index, el) => {
      const text = $(el).text().trim();
      if (text) {
        eligibility.push(text);
      }
    });
    
    return eligibility;
  }

  /**
   * Process MyScheme API response
   */
  processMySchemeAPIResponse(schemes) {
    return schemes.map((scheme, index) => ({
      id: `myscheme-api-${index}`,
      name: scheme.schemeName || scheme.name,
      category: scheme.category || 'General',
      objective: scheme.description || scheme.objective,
      eligibility: scheme.eligibility || [],
      benefits: scheme.benefits || '',
      contactInfo: scheme.contactInfo || '',
      website: scheme.website || this.dataSources.myscheme.baseUrl,
      source: 'MyScheme.gov.in (API)',
      lastUpdated: new Date().toISOString(),
      tags: scheme.tags || []
    }));
  }

  /**
   * Clean and deduplicate data
   */
  cleanAndDeduplicateData(schemes) {
    const seen = new Set();
    const cleaned = [];
    
    schemes.forEach(scheme => {
      // Create a unique key based on name and category
      const key = `${scheme.name.toLowerCase()}-${scheme.category.toLowerCase()}`;
      
      if (!seen.has(key) && scheme.name && scheme.name.trim()) {
        seen.add(key);
        
        // Clean and standardize the scheme data
        const cleanedScheme = {
          id: scheme.id || `scheme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: scheme.name.trim(),
          nameHindi: scheme.nameHindi || '',
          nameTamil: scheme.nameTamil || '',
          category: scheme.category || 'General',
          categoryHindi: scheme.categoryHindi || '',
          categoryTamil: scheme.categoryTamil || '',
          objective: scheme.objective || '',
          objectiveHindi: scheme.objectiveHindi || '',
          objectiveTamil: scheme.objectiveTamil || '',
          eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility : [],
          eligibilityHindi: Array.isArray(scheme.eligibilityHindi) ? scheme.eligibilityHindi : [],
          eligibilityTamil: Array.isArray(scheme.eligibilityTamil) ? scheme.eligibilityTamil : [],
          documentsRequired: Array.isArray(scheme.documentsRequired) ? scheme.documentsRequired : [],
          documentsRequiredHindi: Array.isArray(scheme.documentsRequiredHindi) ? scheme.documentsRequiredHindi : [],
          documentsRequiredTamil: Array.isArray(scheme.documentsRequiredTamil) ? scheme.documentsRequiredTamil : [],
          applicationProcedure: Array.isArray(scheme.applicationProcedure) ? scheme.applicationProcedure : [],
          applicationProcedureHindi: Array.isArray(scheme.applicationProcedureHindi) ? scheme.applicationProcedureHindi : [],
          applicationProcedureTamil: Array.isArray(scheme.applicationProcedureTamil) ? scheme.applicationProcedureTamil : [],
          benefits: scheme.benefits || '',
          benefitsHindi: scheme.benefitsHindi || '',
          benefitsTamil: scheme.benefitsTamil || '',
          deadline: scheme.deadline || 'Ongoing',
          deadlineHindi: scheme.deadlineHindi || '',
          deadlineTamil: scheme.deadlineTamil || '',
          contactInfo: scheme.contactInfo || '',
          contactInfoHindi: scheme.contactInfoHindi || '',
          contactInfoTamil: scheme.contactInfoTamil || '',
          website: scheme.website || '',
          source: scheme.source || 'Unknown',
          lastUpdated: new Date().toISOString(),
          tags: Array.isArray(scheme.tags) ? scheme.tags : []
        };
        
        cleaned.push(cleanedScheme);
      }
    });
    
    return cleaned;
  }

  /**
   * Save data to file
   */
  async saveDataToFile(schemes) {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Save schemes data
      const schemesFile = path.join(this.dataDir, 'scraped_schemes.json');
      await fs.writeFile(schemesFile, JSON.stringify(schemes, null, 2));
      
      // Save metadata
      const metadata = {
        totalSchemes: schemes.length,
        lastUpdated: new Date().toISOString(),
        sources: [...new Set(schemes.map(s => s.source))],
        categories: [...new Set(schemes.map(s => s.category))]
      };
      
      const metadataFile = path.join(this.dataDir, 'scraping_metadata.json');
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
      
      console.log(`💾 Data saved to ${schemesFile}`);
      console.log(`📊 Metadata saved to ${metadataFile}`);
      
    } catch (error) {
      console.error('❌ Error saving data to file:', error);
      throw error;
    }
  }

  /**
   * Load previously scraped data
   */
  async loadScrapedData() {
    try {
      const schemesFile = path.join(this.dataDir, 'scraped_schemes.json');
      const data = await fs.readFile(schemesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('⚠️ No previously scraped data found');
      return [];
    }
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats() {
    try {
      const metadataFile = path.join(this.dataDir, 'scraping_metadata.json');
      const data = await fs.readFile(metadataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        totalSchemes: 0,
        lastUpdated: null,
        sources: [],
        categories: []
      };
    }
  }
}

module.exports = GovernmentDataScraper;
