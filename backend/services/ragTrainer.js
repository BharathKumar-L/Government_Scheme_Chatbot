const fs = require('fs').promises;
const path = require('path');
const { searchSimilarSchemes, addSchemeToVectorDB, addSchemesToVectorDB } = require('./vectorDB');
const GovernmentDataScraper = require('./dataScraper');

class RAGTrainer {
  constructor() {
    this.dataScraper = new GovernmentDataScraper();
    this.dataDir = path.join(__dirname, '../data');
    this.trainingData = [];
    this.modelMetrics = {
      totalSchemes: 0,
      trainingAccuracy: 0,
      lastTrainingDate: null,
      modelVersion: '1.0.0'
    };
  }

  /**
   * Main training pipeline
   */
  async trainRAGModel() {
    console.log('🚀 Starting RAG model training...');
    
    try {
      // Step 1: Fetch fresh data
      console.log('📡 Step 1: Fetching government scheme data...');
      let scrapedData = await this.dataScraper.fetchAllSchemeData();

      // Optional: override with local pre-scraped dataset if enabled
      if (process.env.USE_LOCAL_DATA === 'true') {
        try {
          const rawPath = process.env.LOCAL_DATA_PATH || path.join(this.dataDir, 'scraped_schemes.json');
          // Sanitize Windows-style quoted paths and normalize slashes
          const localPath = rawPath.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
          const normalizedPath = localPath.replace(/\\/g, path.sep);
          const fileBuf = await fs.readFile(normalizedPath, 'utf8');
          const isCsv = normalizedPath.toLowerCase().endsWith('.csv');
          let localData;
          if (isCsv) {
            console.log(`📄 Detected CSV dataset at ${normalizedPath}, parsing...`);
            localData = this.parseCsvToSchemes(fileBuf);
          } else {
            localData = JSON.parse(fileBuf);
          }
          if (Array.isArray(localData) && localData.length > 0) {
            console.log(`📁 Using local dataset from ${normalizedPath} with ${localData.length} records`);
            scrapedData = localData;
          } else {
            console.log('⚠️ Local dataset is empty, continuing with scraped data');
          }
        } catch (e) {
          console.log('⚠️ Failed to read local dataset, continuing with scraped data');
        }
      }
      
      // Step 2: Process and clean data
      console.log('🔧 Step 2: Processing and cleaning data...');
      const processedData = await this.processTrainingData(scrapedData);
      
      // Step 3: Generate training examples
      console.log('📝 Step 3: Generating training examples...');
      const trainingExamples = await this.generateTrainingExamples(processedData);
      
      // Step 4: Train the vector database
      console.log('🧠 Step 4: Training vector database...');
      await this.trainVectorDatabase(processedData);
      
      // Step 5: Validate training
      console.log('✅ Step 5: Validating training...');
      const validationResults = await this.validateTraining();
      
      // Step 6: Save training results
      console.log('💾 Step 6: Saving training results...');
      await this.saveTrainingResults(validationResults);
      
      console.log('🎉 RAG model training completed successfully!');
      return {
        success: true,
        totalSchemes: processedData.length,
        trainingExamples: trainingExamples.length,
        validationResults
      };
      
    } catch (error) {
      console.error('❌ RAG model training failed:', error);
      throw error;
    }
  }

  /**
   * Process training data
   */
  async processTrainingData(schemes) {
    const processedData = [];
    
    for (const scheme of schemes) {
      // Enhance scheme data with additional fields
      const enhancedScheme = {
        ...scheme,
        // Add searchable text
        searchableText: this.createSearchableText(scheme),
        // Add keywords
        keywords: this.extractKeywords(scheme),
        // Add difficulty level
        complexity: this.calculateComplexity(scheme),
        // Add priority score
        priority: this.calculatePriority(scheme)
      };
      
      processedData.push(enhancedScheme);
    }
    
    return processedData;
  }

  /**
   * Create searchable text from scheme data
   */
  createSearchableText(scheme) {
    const textParts = [
      scheme.name,
      scheme.category,
      scheme.objective,
      scheme.eligibility?.join(' '),
      scheme.benefits,
      scheme.tags?.join(' ')
    ].filter(Boolean);
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * Extract keywords from scheme data
   */
  extractKeywords(scheme) {
    const keywords = new Set();
    
    // Add category keywords
    keywords.add(scheme.category.toLowerCase());
    
    // Add name keywords
    scheme.name.toLowerCase().split(' ').forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
    
    // Add objective keywords
    const objectiveWords = scheme.objective?.toLowerCase().split(' ') || [];
    objectiveWords.forEach(word => {
      if (word.length > 4 && !this.isStopWord(word)) {
        keywords.add(word);
      }
    });
    
    // Add common government scheme keywords
    const commonKeywords = [
      'government', 'scheme', 'benefit', 'support', 'assistance',
      'welfare', 'subsidy', 'grant', 'loan', 'scholarship'
    ];
    commonKeywords.forEach(keyword => {
      if (scheme.searchableText?.includes(keyword)) {
        keywords.add(keyword);
      }
    });
    
    return Array.from(keywords);
  }

  /**
   * Calculate scheme complexity
   */
  calculateComplexity(scheme) {
    let complexity = 1; // Base complexity
    
    // Increase complexity based on number of eligibility criteria
    if (scheme.eligibility && scheme.eligibility.length > 3) complexity += 1;
    
    // Increase complexity based on number of required documents
    if (scheme.documentsRequired && scheme.documentsRequired.length > 5) complexity += 1;
    
    // Increase complexity based on application procedure steps
    if (scheme.applicationProcedure && scheme.applicationProcedure.length > 4) complexity += 1;
    
    return Math.min(complexity, 5); // Max complexity of 5
  }

  /**
   * Calculate scheme priority
   */
  calculatePriority(scheme) {
    let priority = 1; // Base priority
    
    // High priority schemes
    const highPriorityKeywords = ['pm kisan', 'mgnrega', 'pmay', 'ayushman', 'jan dhan'];
    if (highPriorityKeywords.some(keyword => 
      scheme.name.toLowerCase().includes(keyword) || 
      scheme.searchableText?.includes(keyword)
    )) {
      priority += 2;
    }
    
    // Medium priority schemes
    const mediumPriorityKeywords = ['scholarship', 'education', 'health', 'employment'];
    if (mediumPriorityKeywords.some(keyword => 
      scheme.searchableText?.includes(keyword)
    )) {
      priority += 1;
    }
    
    return Math.min(priority, 5); // Max priority of 5
  }

  /**
   * Generate training examples for the RAG model
   */
  async generateTrainingExamples(schemes) {
    const trainingExamples = [];
    
    for (const scheme of schemes) {
      // Generate different types of queries for each scheme
      const queries = this.generateQueriesForScheme(scheme);
      
      queries.forEach(query => {
        trainingExamples.push({
          query: query.text,
          language: query.language,
          expectedScheme: scheme.id,
          expectedResponse: this.generateExpectedResponse(scheme, query),
          difficulty: query.difficulty,
          category: query.category
        });
      });
    }
    
    // Save training examples
    await this.saveTrainingExamples(trainingExamples);
    
    return trainingExamples;
  }

  /**
   * Generate various queries for a scheme
   */
  generateQueriesForScheme(scheme) {
    const queries = [];
    
    // General information queries
    queries.push({
      text: `What is ${scheme.name}?`,
      language: 'en',
      difficulty: 'easy',
      category: 'general'
    });
    
    queries.push({
      text: `${scheme.name} के बारे में बताएं`,
      language: 'hi',
      difficulty: 'easy',
      category: 'general'
    });
    
    queries.push({
      text: `${scheme.name} பற்றி சொல்லுங்கள்`,
      language: 'ta',
      difficulty: 'easy',
      category: 'general'
    });
    
    // Eligibility queries
    queries.push({
      text: `Who is eligible for ${scheme.name}?`,
      language: 'en',
      difficulty: 'medium',
      category: 'eligibility'
    });
    
    queries.push({
      text: `${scheme.name} के लिए कौन पात्र है?`,
      language: 'hi',
      difficulty: 'medium',
      category: 'eligibility'
    });
    
    // Benefits queries
    queries.push({
      text: `What are the benefits of ${scheme.name}?`,
      language: 'en',
      difficulty: 'easy',
      category: 'benefits'
    });
    
    // Application procedure queries
    queries.push({
      text: `How to apply for ${scheme.name}?`,
      language: 'en',
      difficulty: 'hard',
      category: 'procedure'
    });
    
    // Category-based queries
    queries.push({
      text: `Tell me about ${scheme.category} schemes`,
      language: 'en',
      difficulty: 'medium',
      category: 'category'
    });
    
    return queries;
  }

  /**
   * Generate expected response for a query
   */
  generateExpectedResponse(scheme, query) {
    const language = query.language;
    
    switch (query.category) {
      case 'general':
        return this.generateGeneralResponse(scheme, language);
      case 'eligibility':
        return this.generateEligibilityResponse(scheme, language);
      case 'benefits':
        return this.generateBenefitsResponse(scheme, language);
      case 'procedure':
        return this.generateProcedureResponse(scheme, language);
      case 'category':
        return this.generateCategoryResponse(scheme, language);
      default:
        return this.generateGeneralResponse(scheme, language);
    }
  }

  /**
   * Generate general response
   */
  generateGeneralResponse(scheme, language) {
    const nameField = language === 'hi' ? 'nameHindi' : language === 'ta' ? 'nameTamil' : 'name';
    const objectiveField = language === 'hi' ? 'objectiveHindi' : language === 'ta' ? 'objectiveTamil' : 'objective';
    
    return `${scheme[nameField] || scheme.name} is a government scheme. ${scheme[objectiveField] || scheme.objective}`;
  }

  /**
   * Generate eligibility response
   */
  generateEligibilityResponse(scheme, language) {
    const eligibilityField = language === 'hi' ? 'eligibilityHindi' : language === 'ta' ? 'eligibilityTamil' : 'eligibility';
    const eligibility = scheme[eligibilityField] || scheme.eligibility || [];
    
    return `Eligibility criteria: ${eligibility.join(', ')}`;
  }

  /**
   * Generate benefits response
   */
  generateBenefitsResponse(scheme, language) {
    const benefitsField = language === 'hi' ? 'benefitsHindi' : language === 'ta' ? 'benefitsTamil' : 'benefits';
    
    return `Benefits: ${scheme[benefitsField] || scheme.benefits}`;
  }

  /**
   * Generate procedure response
   */
  generateProcedureResponse(scheme, language) {
    const procedureField = language === 'hi' ? 'applicationProcedureHindi' : language === 'ta' ? 'applicationProcedureTamil' : 'applicationProcedure';
    const procedure = scheme[procedureField] || scheme.applicationProcedure || [];
    
    return `Application procedure: ${procedure.join(', ')}`;
  }

  /**
   * Generate category response
   */
  generateCategoryResponse(scheme, language) {
    const categoryField = language === 'hi' ? 'categoryHindi' : language === 'ta' ? 'categoryTamil' : 'category';
    
    return `${scheme[categoryField] || scheme.category} scheme: ${scheme.name}`;
  }

  /**
   * Train the vector database with processed data
   */
  async trainVectorDatabase(schemes) {
    console.log(`🧠 Training vector database with ${schemes.length} schemes...`);
    
    // Clear existing vector database
    // Note: In a real implementation, you would clear the existing collection
    
    // Prefer batch ingestion for large datasets
    try {
      await addSchemesToVectorDB(schemes);
    } catch (batchError) {
      console.error('❌ Batch ingestion failed, falling back to per-scheme adds:', batchError);
      for (const scheme of schemes) {
        try {
          await addSchemeToVectorDB(scheme);
        } catch (error) {
          console.error(`❌ Failed to add scheme ${scheme.id} to vector database:`, error);
        }
      }
    }
    
    console.log('✅ Vector database training completed');
  }

  /**
   * Parse CSV text into scheme objects compatible with the pipeline
   * Supported headers (case-insensitive):
   * id,name,category,objective,eligibility,documentsRequired,applicationProcedure,benefits,contactInfo,website,tags,lastUpdated
   * - eligibility/documentsRequired/applicationProcedure/tags can be pipe- or semicolon-separated lists
   */
  parseCsvToSchemes(csvText) {
    const rows = this.parseCSV(csvText);
    if (rows.length === 0) return [];
    const header = rows[0].map(h => String(h || '').trim().toLowerCase());
    const idx = (key) => header.indexOf(key);
    const get = (cols, i) => (i >= 0 && i < cols.length ? cols[i] : '');
    const listify = (s) => {
      if (!s) return [];
      return String(s)
        .split(/\s*[|;]\s*/)
        .map(x => x.trim())
        .filter(Boolean);
    };

    const iId = idx('id');
    const iName = idx('name');
    const iCategory = idx('category');
    const iObjective = idx('objective');
    const iEligibility = idx('eligibility');
    const iDocs = idx('documentsrequired');
    const iProcedure = idx('applicationprocedure');
    const iBenefits = idx('benefits');
    const iContact = idx('contactinfo');
    const iWebsite = idx('website');
    const iTags = idx('tags');
    const iUpdated = idx('lastupdated');

    const result = [];
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      const name = String(get(cols, iName) || '').trim();
      if (!name) continue;
      const id = String(get(cols, iId) || `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
      result.push({
        id,
        name,
        category: String(get(cols, iCategory) || 'General'),
        objective: String(get(cols, iObjective) || ''),
        eligibility: listify(get(cols, iEligibility)),
        documentsRequired: listify(get(cols, iDocs)),
        applicationProcedure: listify(get(cols, iProcedure)),
        benefits: String(get(cols, iBenefits) || ''),
        contactInfo: String(get(cols, iContact) || ''),
        website: String(get(cols, iWebsite) || ''),
        tags: listify(get(cols, iTags)),
        lastUpdated: String(get(cols, iUpdated) || new Date().toISOString()),
        source: 'Local CSV'
      });
    }
    return result;
  }

  /**
   * Minimal CSV parser that supports quoted fields and commas inside quotes
   * Returns array of rows, each row is an array of strings
   */
  parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(field);
          field = '';
        } else if (char === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        } else if (char === '\r') {
          // ignore
        } else {
          field += char;
        }
      }
    }
    // push last field/row
    row.push(field);
    if (row.length > 1 || row[0] !== '') {
      rows.push(row);
    }
    return rows;
  }

  /**
   * Validate training results
   */
  async validateTraining() {
    console.log('🔍 Validating training results...');
    
    const testQueries = [
      'What is PM Kisan scheme?',
      'Tell me about agriculture schemes',
      'How to apply for MGNREGA?',
      'What are the benefits of PMAY?'
    ];
    
    const validationResults = {
      totalTestQueries: testQueries.length,
      successfulRetrievals: 0,
      averageRelevanceScore: 0,
      responseTime: 0
    };
    
    const startTime = Date.now();
    
    for (const query of testQueries) {
      try {
        const results = await searchSimilarSchemes(query, 3);
        
        if (results && results.length > 0) {
          validationResults.successfulRetrievals++;
          
          // Calculate average relevance score
          const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
          validationResults.averageRelevanceScore += avgScore;
        }
      } catch (error) {
        console.error(`❌ Validation failed for query: ${query}`, error);
      }
    }
    
    validationResults.averageRelevanceScore /= testQueries.length;
    validationResults.responseTime = Date.now() - startTime;
    
    console.log('✅ Training validation completed');
    return validationResults;
  }

  /**
   * Save training results
   */
  async saveTrainingResults(validationResults) {
    try {
      const trainingResults = {
        ...this.modelMetrics,
        totalSchemes: validationResults.totalSchemes || 0,
        trainingAccuracy: validationResults.successfulRetrievals / validationResults.totalTestQueries,
        lastTrainingDate: new Date().toISOString(),
        validationResults
      };
      
      const resultsFile = path.join(this.dataDir, 'training_results.json');
      await fs.writeFile(resultsFile, JSON.stringify(trainingResults, null, 2));
      
      console.log('💾 Training results saved');
    } catch (error) {
      console.error('❌ Error saving training results:', error);
    }
  }

  /**
   * Save training examples
   */
  async saveTrainingExamples(examples) {
    try {
      const examplesFile = path.join(this.dataDir, 'training_examples.json');
      await fs.writeFile(examplesFile, JSON.stringify(examples, null, 2));
      
      console.log(`💾 Saved ${examples.length} training examples`);
    } catch (error) {
      console.error('❌ Error saving training examples:', error);
    }
  }

  /**
   * Load training examples
   */
  async loadTrainingExamples() {
    try {
      const examplesFile = path.join(this.dataDir, 'training_examples.json');
      const data = await fs.readFile(examplesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('⚠️ No training examples found');
      return [];
    }
  }

  /**
   * Get training statistics
   */
  async getTrainingStats() {
    try {
      const resultsFile = path.join(this.dataDir, 'training_results.json');
      const data = await fs.readFile(resultsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        totalSchemes: 0,
        trainingAccuracy: 0,
        lastTrainingDate: null,
        modelVersion: '1.0.0'
      };
    }
  }

  /**
   * Check if a word is a stop word
   */
  isStopWord(word) {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Retrain model with new data
   */
  async retrainModel() {
    console.log('🔄 Starting model retraining...');
    
    try {
      // Fetch fresh data
      const freshData = await this.dataScraper.fetchAllSchemeData();
      
      // Compare with existing data
      const existingData = await this.dataScraper.loadScrapedData();
      
      if (this.hasDataChanged(freshData, existingData)) {
        console.log('📊 Data has changed, retraining model...');
        return await this.trainRAGModel();
      } else {
        console.log('ℹ️ No data changes detected, skipping retraining');
        return { success: true, message: 'No retraining needed' };
      }
    } catch (error) {
      console.error('❌ Model retraining failed:', error);
      throw error;
    }
  }

  /**
   * Check if data has changed
   */
  hasDataChanged(newData, existingData) {
    if (newData.length !== existingData.length) return true;
    
    // Check if any scheme has been updated
    for (const newScheme of newData) {
      const existingScheme = existingData.find(s => s.id === newScheme.id);
      if (!existingScheme || existingScheme.lastUpdated !== newScheme.lastUpdated) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = RAGTrainer;
