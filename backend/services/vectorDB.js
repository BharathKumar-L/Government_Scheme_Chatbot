const { ChromaClient } = require('chromadb');
const LocalLLMService = require('./localLLM');
const HuggingFaceLLMService = require('./huggingFaceLLM');
const SimpleLocalLLMService = require('./simpleLocalLLM');

// Choose your preferred local LLM service
const USE_OLLAMA = process.env.USE_OLLAMA === 'true';
const USE_HUGGINGFACE = process.env.USE_HUGGINGFACE === 'true';

let localLLM;
if (USE_OLLAMA) {
  localLLM = new LocalLLMService();
} else if (USE_HUGGINGFACE) {
  localLLM = new HuggingFaceLLMService();
} else {
  localLLM = new SimpleLocalLLMService(); // Default to simple service
}

let chromaClient;
let collection;

/**
 * Initialize ChromaDB client and collection
 */
async function initializeVectorDB() {
  try {
    // Initialize ChromaDB client
    // Allow either full URL in CHROMA_HOST or host+port via CHROMA_PORT
    const chromaHost = process.env.CHROMA_HOST || 'http://localhost:8000';
    const chromaPort = process.env.CHROMA_PORT;
    const chromaPath = chromaHost.startsWith('http')
      ? (chromaPort ? `${chromaHost.replace(/\/$/, '')}:${chromaPort}` : chromaHost)
      : `http://${chromaHost}:${chromaPort || '8000'}`;

    chromaClient = new ChromaClient({
      path: chromaPath
    });
    
    // Create or get collection
    const collectionName = 'government_schemes';
    
    try {
      collection = await chromaClient.getCollection({
        name: collectionName
      });
      console.log(`📊 Connected to existing collection: ${collectionName}`);
    } catch (error) {
      // Collection doesn't exist, create it
      collection = await chromaClient.createCollection({
        name: collectionName,
        metadata: {
          description: 'Government schemes for RAG-based chatbot',
          created_at: new Date().toISOString()
        }
      });
      console.log(`📊 Created new collection: ${collectionName}`);
    }
    
    // Check if collection is empty and populate it
    const count = await collection.count();
    if (count === 0) {
      console.log('📝 Collection is empty, populating with sample data...');
      await populateVectorDB();
    } else {
      console.log(`📊 Collection contains ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Vector database initialization failed:', error);
    // Fallback to in-memory storage for development
    console.log('🔄 Falling back to in-memory vector storage...');
    await initializeInMemoryVectorDB();
  }
}

/**
 * Fallback in-memory vector database for development
 */
let inMemoryVectors = [];
let inMemoryEmbeddings = [];

async function initializeInMemoryVectorDB() {
  console.log('💾 Initializing in-memory vector database...');
  await populateInMemoryVectorDB();
}

/**
 * Generate embeddings using local model
 */
async function generateEmbedding(text) {
  try {
    return await localLLM.generateEmbedding(text);
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    // Fallback to simple text hashing for development
    return generateSimpleEmbedding(text);
  }
}

/**
 * Simple embedding fallback for development
 */
function generateSimpleEmbedding(text) {
  // Simple hash-based embedding for development
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0);
  
  words.forEach(word => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % 1536;
    embedding[index] += 1;
  });
  
  return embedding;
}

/**
 * Populate vector database with government schemes
 */
async function populateVectorDB() {
  const { getAllSchemes } = require('./database');
  const schemes = getAllSchemes();
  
  console.log(`📝 Processing ${schemes.length} schemes for vector database...`);
  
  const documents = [];
  const metadatas = [];
  const ids = [];
  const embeddings = [];
  
  for (const scheme of schemes) {
    // Create comprehensive text for each scheme
    const schemeText = createSchemeText(scheme);
    
    // Generate embedding
    const embedding = await generateEmbedding(schemeText);
    
    // Prepare data for ChromaDB
    documents.push(schemeText);
    metadatas.push({
      id: scheme.id,
      name: scheme.name,
      category: scheme.category,
      tags: scheme.tags?.join(', ') || '',
      language: 'en'
    });
    ids.push(scheme.id);
    embeddings.push(embedding);
  }
  
  // Add to ChromaDB
  await collection.add({
    documents,
    metadatas,
    ids,
    embeddings
  });
  
  console.log(`✅ Added ${schemes.length} schemes to vector database`);
}

/**
 * Batch add multiple schemes to the vector database
 */
async function addSchemesToVectorDB(schemes, batchSize = parseInt(process.env.BATCH_SIZE || '500')) {
  try {
    if (!schemes || schemes.length === 0) {
      return;
    }

    if (collection) {
      // ChromaDB path
      for (let start = 0; start < schemes.length; start += batchSize) {
        const batch = schemes.slice(start, start + batchSize);

        const documents = [];
        const metadatas = [];
        const ids = [];
        const embeddings = [];

        for (const scheme of batch) {
          const schemeText = createSchemeText(scheme);
          const embedding = await generateEmbedding(schemeText);
          documents.push(schemeText);
          metadatas.push({
            id: scheme.id,
            name: scheme.name,
            category: scheme.category,
            tags: scheme.tags?.join(', ') || '',
            language: 'en'
          });
          ids.push(scheme.id);
          embeddings.push(embedding);
        }

        await collection.add({
          documents,
          metadatas,
          ids,
          embeddings
        });

        console.log(`✅ Added batch ${Math.floor(start / batchSize) + 1} (${batch.length} schemes)`);
      }
    } else {
      // In-memory fallback path
      for (const scheme of schemes) {
        const schemeText = createSchemeText(scheme);
        const embedding = await generateEmbedding(schemeText);
        inMemoryVectors.push({
          id: scheme.id,
          text: schemeText,
          metadata: {
            id: scheme.id,
            name: scheme.name,
            category: scheme.category,
            tags: scheme.tags?.join(', ') || '',
            language: 'en'
          }
        });
        inMemoryEmbeddings.push(embedding);
      }
      console.log(`✅ Added ${schemes.length} schemes to in-memory vector database`);
    }
  } catch (error) {
    console.error('❌ Failed batch adding schemes to vector database:', error);
    throw error;
  }
}

/**
 * Populate in-memory vector database
 */
async function populateInMemoryVectorDB() {
  const { getAllSchemes } = require('./database');
  const schemes = getAllSchemes();
  
  console.log(`📝 Processing ${schemes.length} schemes for in-memory vector database...`);
  
  for (const scheme of schemes) {
    const schemeText = createSchemeText(scheme);
    const embedding = await generateEmbedding(schemeText);
    
    inMemoryVectors.push({
      id: scheme.id,
      text: schemeText,
      metadata: {
        id: scheme.id,
        name: scheme.name,
        category: scheme.category,
        tags: scheme.tags?.join(', ') || '',
        language: 'en'
      }
    });
    
    inMemoryEmbeddings.push(embedding);
  }
  
  console.log(`✅ Added ${schemes.length} schemes to in-memory vector database`);
}

/**
 * Create comprehensive text representation of a scheme
 */
function createSchemeText(scheme) {
  return `
    Scheme Name: ${scheme.name}
    Category: ${scheme.category}
    Objective: ${scheme.objective}
    Eligibility: ${scheme.eligibility?.join(', ')}
    Documents Required: ${scheme.documentsRequired?.join(', ')}
    Application Procedure: ${scheme.applicationProcedure?.join(', ')}
    Benefits: ${scheme.benefits}
    Contact Info: ${scheme.contactInfo}
    Website: ${scheme.website}
    Tags: ${scheme.tags?.join(', ')}
  `.trim();
}

/**
 * Search for relevant schemes using vector similarity
 */
async function searchSimilarSchemes(query, limit = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    if (collection) {
      // Use ChromaDB
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });
      
      return results.metadatas[0].map((metadata, index) => ({
        id: metadata.id,
        name: metadata.name,
        category: metadata.category,
        score: 1 - results.distances[0][index], // Convert distance to similarity score
        metadata
      }));
    } else {
      // Use in-memory search
      return searchInMemoryVectors(queryEmbedding, limit);
    }
  } catch (error) {
    console.error('❌ Vector search failed:', error);
    return [];
  }
}

/**
 * Search in-memory vectors using cosine similarity
 */
function searchInMemoryVectors(queryEmbedding, limit) {
  const similarities = inMemoryEmbeddings.map((embedding, index) => {
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    return {
      index,
      similarity
    };
  });
  
  // Sort by similarity and get top results
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, limit).map(item => {
    const vector = inMemoryVectors[item.index];
    return {
      id: vector.id,
      name: vector.metadata.name,
      category: vector.metadata.category,
      score: item.similarity,
      metadata: vector.metadata
    };
  });
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Add new scheme to vector database
 */
async function addSchemeToVectorDB(scheme) {
  try {
    const schemeText = createSchemeText(scheme);
    const embedding = await generateEmbedding(schemeText);
    
    if (collection) {
      await collection.add({
        documents: [schemeText],
        metadatas: [{
          id: scheme.id,
          name: scheme.name,
          category: scheme.category,
          tags: scheme.tags?.join(', ') || '',
          language: 'en'
        }],
        ids: [scheme.id],
        embeddings: [embedding]
      });
    } else {
      inMemoryVectors.push({
        id: scheme.id,
        text: schemeText,
        metadata: {
          id: scheme.id,
          name: scheme.name,
          category: scheme.category,
          tags: scheme.tags?.join(', ') || '',
          language: 'en'
        }
      });
      inMemoryEmbeddings.push(embedding);
    }
    
    console.log(`✅ Added scheme ${scheme.id} to vector database`);
  } catch (error) {
    console.error('❌ Failed to add scheme to vector database:', error);
  }
}

module.exports = {
  initializeVectorDB,
  searchSimilarSchemes,
  addSchemeToVectorDB,
  addSchemesToVectorDB
};
