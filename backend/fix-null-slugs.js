const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const mongoUri = 'mongodb://127.0.0.1:27017/ruralconnect';

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB for slug fix'))
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
});

// Get all schemes with null slugs
async function fixNullSlugs() {
  const Scheme = require('./models/Scheme');
  
  try {
    const schemes = await Scheme.find({ slug: null });
    console.log(`Found ${schemes.length} schemes with null slugs`);

    for (const scheme of schemes) {
      const baseSlug = scheme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Find a unique slug by appending numbers if necessary
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await Scheme.findOne({ slug, _id: { $ne: scheme._id } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Update the scheme with the new slug
      await Scheme.findByIdAndUpdate(scheme._id, { slug });
      console.log(`Updated scheme ${scheme.name} with new slug: ${slug}`);
    }

    console.log('Finished updating null slugs');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing slugs:', error);
    process.exit(1);
  }
}

fixNullSlugs();