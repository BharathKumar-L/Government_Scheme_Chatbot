const { connectToMongoDB, isConnected } = require('./backend/services/mongodb');
const { addScheme, getAllSchemes } = require('./backend/services/mongodbDatabase');

async function testDataStorage() {
  try {
    console.log('🧪 Testing Data Storage...\n');
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    if (!isConnected()) {
      console.log('❌ MongoDB not connected');
      return;
    }
    
    console.log('✅ MongoDB connected');
    
    // Get current schemes count
    const currentSchemes = await getAllSchemes();
    console.log(`📊 Current schemes in database: ${currentSchemes.length}`);
    
    // Add a test scheme
    const testScheme = {
      id: 'test-storage-' + Date.now(),
      name: 'Test Storage Scheme',
      category: 'Test',
      objective: 'Testing data storage functionality',
      benefits: 'Test benefits for storage',
      eligibility: ['Test eligibility criteria'],
      documentsRequired: ['Test documents'],
      applicationProcedure: ['Test application steps'],
      contactInfo: 'Test contact information',
      website: 'https://test-storage.com',
      tags: ['test', 'storage'],
      source: 'Data Storage Test'
    };
    
    console.log('\n📝 Adding test scheme...');
    const addedScheme = await addScheme(testScheme);
    console.log(`✅ Scheme added: ${addedScheme.name}`);
    
    // Verify the scheme was added
    const updatedSchemes = await getAllSchemes();
    console.log(`📊 Updated schemes count: ${updatedSchemes.length}`);
    
    if (updatedSchemes.length > currentSchemes.length) {
      console.log('🎉 Data storage is working correctly!');
    } else {
      console.log('❌ Data storage failed - scheme count did not increase');
    }
    
    // Show the added scheme
    const foundScheme = updatedSchemes.find(s => s.id === testScheme.id);
    if (foundScheme) {
      console.log('\n📋 Added scheme details:');
      console.log(`   ID: ${foundScheme.id}`);
      console.log(`   Name: ${foundScheme.name}`);
      console.log(`   Category: ${foundScheme.category}`);
      console.log(`   Source: ${foundScheme.source}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testDataStorage();
