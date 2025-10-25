# 🚀 RAG Training Guide for RuralConnect

This guide explains how to train your RAG model with real government scheme data instead of using local static data.

## 🎯 Overview

The RAG training system automatically:
1. **Fetches** real government scheme data from official sources
2. **Processes** and cleans the data
3. **Trains** the vector database with embeddings
4. **Validates** the training results
5. **Schedules** automatic retraining

## 📡 Data Sources

### **Primary Sources:**
- **MyScheme.gov.in** - Central government schemes portal
- **National Scholarship Portal (NSP)** - Education and scholarship schemes
- **PM Kisan Portal** - Agriculture and farmer schemes

### **Data Types Fetched:**
- Scheme names and descriptions
- Eligibility criteria
- Application procedures
- Benefits and amounts
- Contact information
- Official websites
- Deadlines and timelines

## 🚀 Quick Start

### **Step 1: Install Dependencies**
```bash
cd backend
npm install
```

### **Step 2: Start Training**
```bash
# Start the backend server
npm run dev

# In another terminal, trigger training
curl -X POST http://localhost:3001/api/training/train
```

### **Step 3: Check Training Status**
```bash
curl http://localhost:3001/api/training/status
```

## 🛠️ API Endpoints

### **Training Endpoints:**

#### **1. Train RAG Model**
```bash
POST /api/training/train
```
**Body:**
```json
{
  "forceRetrain": false,
  "dataSources": ["myscheme", "nsp", "pmkisan"]
}
```

#### **2. Retrain Model**
```bash
POST /api/training/retrain
```

#### **3. Fetch Fresh Data**
```bash
POST /api/training/fetch-data
```

#### **4. Get Training Status**
```bash
GET /api/training/status
```

#### **5. Validate Model**
```bash
POST /api/training/validate
```
**Body:**
```json
{
  "testQueries": [
    "What is PM Kisan scheme?",
    "Tell me about agriculture schemes",
    "How to apply for MGNREGA?"
  ]
}
```

#### **6. Get Training Examples**
```bash
GET /api/training/examples?limit=50&category=general&language=en
```

#### **7. Get Data Sources**
```bash
GET /api/training/sources
```

## 🔄 Training Process

### **Step 1: Data Fetching**
```javascript
// The system fetches data from multiple sources
const myschemeData = await fetchMySchemeData();
const nspData = await fetchNSPData();
const pmkisanData = await fetchPMKisanData();
```

### **Step 2: Data Processing**
```javascript
// Clean and standardize data
const processedData = await processTrainingData(schemes);

// Enhance with additional fields
const enhancedScheme = {
  ...scheme,
  searchableText: createSearchableText(scheme),
  keywords: extractKeywords(scheme),
  complexity: calculateComplexity(scheme),
  priority: calculatePriority(scheme)
};
```

### **Step 3: Training Example Generation**
```javascript
// Generate various query types for each scheme
const queries = [
  `What is ${scheme.name}?`,
  `Who is eligible for ${scheme.name}?`,
  `What are the benefits of ${scheme.name}?`,
  `How to apply for ${scheme.name}?`
];
```

### **Step 4: Vector Database Training**
```javascript
// Train the vector database with processed data
for (const scheme of schemes) {
  await addSchemeToVectorDB(scheme);
}
```

### **Step 5: Validation**
```javascript
// Test the trained model
const testQueries = [
  'What is PM Kisan scheme?',
  'Tell me about agriculture schemes'
];

for (const query of testQueries) {
  const results = await searchSimilarSchemes(query, 3);
  // Validate results...
}
```

## 📊 Training Metrics

### **Key Metrics Tracked:**
- **Total Schemes**: Number of schemes in the database
- **Training Accuracy**: Success rate of query retrieval
- **Response Time**: Average time to retrieve relevant schemes
- **Data Freshness**: Last update timestamp
- **Source Coverage**: Number of data sources used

### **Example Training Results:**
```json
{
  "success": true,
  "results": {
    "totalSchemes": 150,
    "trainingExamples": 600,
    "validationResults": {
      "totalTestQueries": 10,
      "successfulRetrievals": 9,
      "averageRelevanceScore": 0.85,
      "responseTime": 120
    }
  }
}
```

## 🕐 Scheduled Training

### **Automatic Training Schedule:**
- **Daily Training**: 2:00 AM IST
- **Data Fetching**: Every 6 hours
- **Validation**: After each training

### **Manual Training:**
```bash
# Force immediate training
curl -X POST http://localhost:3001/api/training/train \
  -H "Content-Type: application/json" \
  -d '{"forceRetrain": true}'
```

## 🔧 Configuration

### **Environment Variables:**
```env
# Training Configuration
TRAINING_SCHEDULE=0 2 * * *
DATA_FETCH_SCHEDULE=0 */6 * * *
TRAINING_THRESHOLD=24
VALIDATION_THRESHOLD=0.8

# Data Sources
MYSCHEME_ENABLED=true
NSP_ENABLED=true
PMKISAN_ENABLED=true

# Model Configuration
EMBEDDING_DIMENSION=384
SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5
```

## 📈 Performance Optimization

### **1. Data Caching:**
```javascript
// Cache frequently accessed data
const cachedData = await redis.get('schemes_cache');
if (!cachedData) {
  const freshData = await fetchAllSchemeData();
  await redis.setex('schemes_cache', 3600, JSON.stringify(freshData));
}
```

### **2. Batch Processing:**
```javascript
// Process data in batches
const batchSize = 50;
for (let i = 0; i < schemes.length; i += batchSize) {
  const batch = schemes.slice(i, i + batchSize);
  await processBatch(batch);
}
```

### **3. Parallel Processing:**
```javascript
// Fetch data from multiple sources in parallel
const [myschemeData, nspData, pmkisanData] = await Promise.all([
  fetchMySchemeData(),
  fetchNSPData(),
  fetchPMKisanData()
]);
```

## 🧪 Testing and Validation

### **1. Unit Tests:**
```bash
# Run training tests
npm test -- --grep "training"
```

### **2. Integration Tests:**
```bash
# Test full training pipeline
npm run test:integration
```

### **3. Manual Validation:**
```bash
# Test specific queries
curl -X POST http://localhost:3001/api/training/validate \
  -H "Content-Type: application/json" \
  -d '{
    "testQueries": [
      "What is PM Kisan scheme?",
      "Tell me about education schemes",
      "How to apply for housing schemes?"
    ]
  }'
```

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. Data Fetching Fails:**
```bash
# Check network connectivity
curl -I https://www.myscheme.gov.in

# Check API endpoints
curl https://www.myscheme.gov.in/api/schemes
```

#### **2. Training Fails:**
```bash
# Check logs
tail -f backend/logs/training.log

# Check memory usage
free -h
```

#### **3. Validation Fails:**
```bash
# Check vector database
curl http://localhost:3001/api/training/status

# Test individual components
curl http://localhost:3001/api/schemes
```

### **Debug Mode:**
```bash
# Enable debug logging
DEBUG=training:* npm run dev
```

## 📊 Monitoring

### **Training Metrics Dashboard:**
```bash
# Get comprehensive statistics
curl http://localhost:3001/api/training/status | jq
```

### **Health Checks:**
```bash
# Check system health
curl http://localhost:3001/health

# Check training health
curl http://localhost:3001/api/training/status
```

## 🔄 Continuous Improvement

### **1. Data Quality Monitoring:**
- Track data freshness
- Monitor source availability
- Validate data completeness

### **2. Model Performance:**
- Track query success rates
- Monitor response times
- Analyze user feedback

### **3. Regular Updates:**
- Update data sources
- Improve scraping logic
- Enhance training algorithms

## 📚 Advanced Features

### **1. Custom Data Sources:**
```javascript
// Add custom data source
const customScraper = new CustomDataScraper();
await customScraper.fetchData();
```

### **2. Model Fine-tuning:**
```javascript
// Fine-tune for specific domains
const domainSpecificTraining = new DomainSpecificTrainer();
await domainSpecificTraining.train('agriculture');
```

### **3. A/B Testing:**
```javascript
// Test different model configurations
const modelA = new ModelConfiguration({ embeddingSize: 384 });
const modelB = new ModelConfiguration({ embeddingSize: 512 });
```

## 🎉 Success Metrics

### **Training Success Indicators:**
- ✅ **Data Fetching**: >95% success rate
- ✅ **Training Accuracy**: >85% query success
- ✅ **Response Time**: <200ms average
- ✅ **Data Freshness**: <24 hours old
- ✅ **Coverage**: >100 schemes

### **User Experience Metrics:**
- ✅ **Query Success**: >90% relevant results
- ✅ **Response Quality**: >4.0/5.0 rating
- ✅ **Multilingual**: 3 languages supported
- ✅ **Uptime**: >99.5% availability

---

**Congratulations!** Your RAG model is now trained with real government scheme data and will automatically stay updated! 🎉
