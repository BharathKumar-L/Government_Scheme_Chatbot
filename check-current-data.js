const { connectToMongoDB, isConnected } = require('./backend/services/mongodb');
const { getAllSchemes } = require('./backend/services/mongodbDatabase');

async function checkCurrentData() {
  try {
    console.log('🔍 Checking Current Data in Database...\n');
    
    // Connect to MongoDB
    await connectToMongoDB();
    
    if (!isConnected()) {
      console.log('❌ MongoDB not connected');
      return;
    }
    
    console.log('✅ MongoDB connected');
    
    // Get all schemes
    const schemes = await getAllSchemes();
    console.log(`📊 Total schemes in database: ${schemes.length}\n`);
    
    // Display each scheme
    schemes.forEach((scheme, index) => {
      console.log(`--- Scheme ${index + 1} ---`);
      console.log(`ID: ${scheme.id}`);
      console.log(`Name: ${scheme.name}`);
      console.log(`Category: ${scheme.category}`);
      console.log(`Objective: ${scheme.objective}`);
      console.log(`Benefits: ${scheme.benefits}`);
      console.log(`Eligibility: ${JSON.stringify(scheme.eligibility)}`);
      console.log(`Documents: ${JSON.stringify(scheme.documentsRequired)}`);
      console.log(`Contact: ${scheme.contactInfo}`);
      console.log(`Website: ${scheme.website}`);
      console.log(`Tags: ${JSON.stringify(scheme.tags)}`);
      console.log(`Source: ${scheme.source}`);
      console.log(`Upload Date: ${scheme.uploadDate}`);
      console.log(`Last Updated: ${scheme.lastUpdated}`);
      console.log('');
    });
    
    // Check for any unusual content
    const allText = schemes.map(s => 
      `${s.name} ${s.objective} ${s.benefits} ${s.contactInfo}`.toLowerCase()
    ).join(' ');
    
    if (allText.includes('girl')) {
      console.log('⚠️ Found "girl" in the data - this might be the issue');
    } else {
      console.log('✅ No "girl" found in the data');
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   - Total schemes: ${schemes.length}`);
    console.log(`   - Database: MongoDB Atlas`);
    console.log(`   - Data integrity: ${schemes.length > 0 ? 'Good' : 'No data'}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
  
  process.exit(0);
}

checkCurrentData();
