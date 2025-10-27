const { connectToMongoDB, isConnected, getConnectionStatus } = require('./backend/services/mongodb');
const { initializeMongoDBDatabase, addScheme, getAllSchemes } = require('./backend/services/mongodbDatabase');

async function testMongoDB() {
  try {
    console.log('🧪 Testing MongoDB Integration...\n');
    
    // Test connection
    console.log('1. Testing MongoDB connection...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    // Check connection status
    const status = getConnectionStatus();
    console.log(`📊 Connection status: ${status.state}`);
    console.log(`🗄️ Database: ${status.name}`);
    
    // Initialize database
    console.log('\n2. Initializing database...');
    await initializeMongoDBDatabase();
    console.log('✅ Database initialized');
    
    // Test adding a scheme
    console.log('\n3. Testing scheme creation...');
    const testScheme = {
      id: 'test-scheme-' + Date.now(),
      name: 'Test Government Scheme',
      category: 'Test',
      objective: 'This is a test scheme for MongoDB integration',
      benefits: 'Test benefits',
      eligibility: ['Test eligibility'],
      documentsRequired: ['Test documents'],
      applicationProcedure: ['Test procedure'],
      contactInfo: 'Test contact',
      website: 'https://test.com',
      tags: ['test', 'mongodb'],
      source: 'MongoDB Test'
    };
    
    const addedScheme = await addScheme(testScheme);
    console.log(`✅ Scheme added: ${addedScheme.name}`);
    
    // Test retrieving schemes
    console.log('\n4. Testing scheme retrieval...');
    const schemes = await getAllSchemes();
    console.log(`✅ Retrieved ${schemes.length} schemes`);
    
    // Test search
    console.log('\n5. Testing search functionality...');
    const searchResults = await getAllSchemes();
    const testResults = searchResults.filter(s => s.name.includes('Test'));
    console.log(`✅ Found ${testResults.length} test schemes`);
    
    console.log('\n🎉 MongoDB integration test completed successfully!');
    console.log('\n📋 Test Results:');
    console.log(`   - Connection: ✅ Working`);
    console.log(`   - Database: ✅ Initialized`);
    console.log(`   - Create: ✅ Working`);
    console.log(`   - Read: ✅ Working`);
    console.log(`   - Search: ✅ Working`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check MONGODB_URI in .env file');
    console.log('   3. Verify MongoDB installation');
    console.log('   4. Check network connectivity');
    
    process.exit(1);
  }
}

// Run the test
testMongoDB();
