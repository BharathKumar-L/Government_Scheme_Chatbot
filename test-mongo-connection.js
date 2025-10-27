const { connectToMongoDB, isConnected } = require('./backend/services/mongodb');
const { addScheme, getAllSchemes } = require('./backend/services/mongodbDatabase');

async function testMongoConnection() {
  try {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    // Test connection
    console.log('1. Connecting to MongoDB...');
    await connectToMongoDB();
    
    if (isConnected()) {
      console.log('✅ MongoDB connected successfully!');
      
      // Test adding a scheme
      console.log('\n2. Testing scheme creation...');
      const testScheme = {
        id: 'test-mongo-' + Date.now(),
        name: 'MongoDB Test Scheme',
        category: 'Test',
        objective: 'Testing MongoDB integration',
        benefits: 'Test benefits',
        eligibility: ['Test eligibility'],
        documentsRequired: ['Test documents'],
        applicationProcedure: ['Test procedure'],
        contactInfo: 'Test contact',
        website: 'https://test.com',
        tags: ['test', 'mongodb'],
        source: 'MongoDB Test'
      };
      
      const result = await addScheme(testScheme);
      console.log(`✅ Scheme added: ${result.name}`);
      
      // Test retrieving schemes
      console.log('\n3. Testing scheme retrieval...');
      const schemes = await getAllSchemes();
      console.log(`✅ Retrieved ${schemes.length} schemes from MongoDB`);
      
      console.log('\n🎉 MongoDB integration is working perfectly!');
      console.log('📊 Database Status: MongoDB Atlas Connected');
      
    } else {
      console.log('❌ MongoDB connection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testMongoConnection();
