const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

// For embeddings - using a simple approach with transformers
let embedder = null;
const embeddingCache = new NodeCache({ stdTTL: 3600 });

const STOPWORDS = new Set([
  'the', 'is', 'are', 'a', 'an', 'for', 'to', 'of', 'in', 'on', 'and', 'or',
  'with', 'about', 'scheme', 'schemes', 'need', 'want', 'looking', 'find', 'me'
]);

const QUERY_EXPANSIONS = {
  farmer: ['agriculture', 'agri', 'kisan', 'crop'],
  student: ['scholarship', 'education', 'school', 'college'],
  pension: ['elderly', 'senior', 'oldage', 'retirement'],
  elderly: ['senior', 'pension', 'oldage'],
  women: ['female', 'girl', 'mahila'],
  disability: ['disabled', 'divyang']
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getQueryTerms = (query = '') =>
  normalizeText(query)
    .split(' ')
    .filter((term) => term.length > 2 && !STOPWORDS.has(term));

const expandQueryTerms = (terms = []) => {
  const expanded = new Set(terms);
  for (const term of terms) {
    const additions = QUERY_EXPANSIONS[term] || [];
    for (const add of additions) expanded.add(add);
  }
  return Array.from(expanded);
};

const calculateKeywordScore = (scheme = {}, terms = []) => {
  if (!terms.length) return 0;

  const name = normalizeText(scheme.name);
  const category = normalizeText(scheme.category);
  const details = normalizeText(scheme.details);
  const benefits = normalizeText(scheme.benefits);
  const eligibility = normalizeText(scheme.eligibility);

  let score = 0;

  for (const term of terms) {
    if (name.includes(term)) score += 1.0;
    if (category.includes(term)) score += 0.8;
    if (details.includes(term)) score += 0.5;
    if (benefits.includes(term)) score += 0.5;
    if (eligibility.includes(term)) score += 0.4;
  }

  const maxPerTerm = 3.2;
  return Math.min(1, score / (terms.length * maxPerTerm));
};

// Initialize embeddings model
const initializeEmbeddings = async () => {
  try {
    if (!embedder && process.env.USE_HUGGINGFACE === 'true') {
      const { pipeline } = await import('@xenova/transformers');
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('✓ Embeddings model loaded');
    }
  } catch (error) {
    console.warn('Warning: Could not load transformer model for embeddings:', error.message);
    console.warn('Using fallback embedding strategy');
  }
};

// Generate embedding for text
const generateEmbedding = async (text) => {
  const cacheKey = `embed_${text}`;

  // Check cache first
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    if (embedder) {
      // Use transformer embeddings
      const result = await embedder(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      embeddingCache.set(cacheKey, embedding);
      return embedding;
    } else {
      // Simple fallback: hash-based deterministic embedding
      return generateSimpleEmbedding(text);
    }
  } catch (error) {
    console.warn('Embedding generation failed, using fallback:', error.message);
    return generateSimpleEmbedding(text);
  }
};

// Simple deterministic embedding fallback (for development)
const generateSimpleEmbedding = (text) => {
  const words = text.toLowerCase().split(/\W+/);
  const embedding = new Array(384).fill(0);

  words.forEach((word, idx) => {
    const hash = word.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += (hash * Math.sin(i + idx)) / 1000;
    }
  });

  return embedding.map(v => v / (1 + Math.abs(v)));
};

// Vector similarity (cosine)
const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
};

// In-memory vector store (fallback when ChromaDB unavailable)
class InMemoryVectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = {};
  }

  async add(documents) {
    for (const doc of documents) {
      const embedding = await generateEmbedding(doc.content || doc.text || '');
      this.documents.push({ ...doc, embedding });
      this.embeddings[doc.id] = embedding;
    }
  }

  async query(text, topK = 5) {
    const queryEmbedding = await generateEmbedding(text);

    const similarities = this.documents.map((doc, idx) => ({
      doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      index: idx
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => ({
        ...item.doc,
        score: item.similarity
      }));
  }

  async update(id, document) {
    const doc = this.documents.find(d => d.id === id);
    if (doc) {
      const embedding = await generateEmbedding(document.content || document.text || '');
      Object.assign(doc, document, { embedding });
      this.embeddings[id] = embedding;
    }
  }

  async delete(id) {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx > -1) {
      this.documents.splice(idx, 1);
      delete this.embeddings[id];
    }
  }

  clear() {
    this.documents = [];
    this.embeddings = {};
  }
}

// VectorDB Manager
class VectorDBManager {
  constructor() {
    this.store = new InMemoryVectorStore();
    this.initialized = false;
  }

  async initialize() {
    await initializeEmbeddings();
    this.initialized = true;
    console.log('✓ Vector DB initialized');
  }

  async addSchemes(schemes) {
    const documents = schemes.map(scheme => ({
      id: scheme._id || scheme.id,
      content: `${scheme.name || ''} ${scheme.details || ''} ${scheme.benefits || ''} ${scheme.eligibility || ''}`,
      metadata: scheme
    }));

    await this.store.add(documents);
  }

  async searchSchemesByKeywords(query, limit = 10) {
    const Scheme = require('../models/Scheme');
    const terms = getQueryTerms(query);
    const base = normalizeText(query);
    const regexList = (terms.length ? terms : [base])
      .filter(Boolean)
      .map((term) => new RegExp(term, 'i'));

    const orConditions = [];
    for (const regex of regexList) {
      orConditions.push(
        { name: regex },
        { category: regex },
        { details: regex },
        { benefits: regex },
        { eligibility: regex }
      );
    }

    if (!orConditions.length) return [];

    return Scheme.find({ isActive: true, $or: orConditions })
      .limit(limit)
      .lean();
  }

  async searchSchemes(query, topK = 5) {
    try {
      const terms = expandQueryTerms(getQueryTerms(query));
      const semanticRaw = this.store.documents.length > 0
        ? await this.store.query(query, Math.max(topK * 4, 20))
        : [];
      const keywordRaw = await this.searchSchemesByKeywords(query, Math.max(topK * 6, 30));

      const merged = new Map();

      for (const item of semanticRaw) {
        const scheme = item.metadata || {};
        const id = scheme._id || scheme.id;
        if (!id) continue;
        merged.set(String(id), {
          ...scheme,
          _semanticScore: Math.max(0, item.score || 0),
          _keywordScore: calculateKeywordScore(scheme, terms)
        });
      }

      for (const scheme of keywordRaw) {
        const id = scheme._id || scheme.id;
        if (!id) continue;

        const existing = merged.get(String(id));
        const keywordScore = calculateKeywordScore(scheme, terms);

        if (existing) {
          existing._keywordScore = Math.max(existing._keywordScore || 0, keywordScore);
        } else {
          merged.set(String(id), {
            ...scheme,
            _semanticScore: 0,
            _keywordScore: keywordScore
          });
        }
      }

      const ranked = Array.from(merged.values())
        .map((scheme) => {
          const titleBoost = terms.some((term) => normalizeText(scheme.name).includes(term)) ? 0.08 : 0;
          const categoryBoost = terms.some((term) => normalizeText(scheme.category).includes(term)) ? 0.05 : 0;
          const relevanceScore = Math.min(
            1,
            (scheme._semanticScore * 0.55) + (scheme._keywordScore * 0.45) + titleBoost + categoryBoost
          );

          return {
            ...scheme,
            relevanceScore
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, topK)
        .map(({ _semanticScore, _keywordScore, ...clean }) => clean);

      return ranked;
    } catch (error) {
      console.error('Error searching schemes:', error);
      return [];
    }
  }

  async updateScheme(schemeId, scheme) {
    const document = {
      id: schemeId,
      content: `${scheme.name || ''} ${scheme.details || ''} ${scheme.benefits || ''} ${scheme.eligibility || ''}`,
      metadata: scheme
    };
    await this.store.update(schemeId, document);
  }

  async deleteScheme(schemeId) {
    await this.store.delete(schemeId);
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    return {
      documentsCount: this.store.documents.length,
      status: this.initialized ? 'ready' : 'initializing'
    };
  }
}

let vectorDBInstance = null;

const getVectorDB = () => {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDBManager();
  }
  return vectorDBInstance;
};

module.exports = {
  getVectorDB,
  generateEmbedding,
  cosineSimilarity,
  initializeEmbeddings,
  VectorDBManager
};
