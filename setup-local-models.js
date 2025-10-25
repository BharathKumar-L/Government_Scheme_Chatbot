#!/usr/bin/env node

/**
 * Setup script for local LLM models
 * This script helps you set up and test your local RAG system
 */

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class LocalModelSetup {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.useOllama = process.env.USE_OLLAMA === 'true';
  }

  /**
   * Check if Ollama is running
   */
  async checkOllamaStatus() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      console.log('✅ Ollama is running');
      return true;
    } catch (error) {
      console.log('❌ Ollama is not running');
      console.log('Please start Ollama: ollama serve');
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      
      console.log('\n📋 Available Models:');
      models.forEach(model => {
        console.log(`  - ${model.name} (${this.formatSize(model.size)})`);
      });
      
      return models;
    } catch (error) {
      console.error('❌ Failed to list models:', error.message);
      return [];
    }
  }

  /**
   * Pull required models
   */
  async pullModels() {
    const requiredModels = [
      'llama2:7b',
      'nomic-embed-text'
    ];

    console.log('\n📥 Pulling required models...');
    
    for (const model of requiredModels) {
      try {
        console.log(`\n🔄 Pulling ${model}...`);
        await this.pullModel(model);
        console.log(`✅ ${model} pulled successfully`);
      } catch (error) {
        console.error(`❌ Failed to pull ${model}:`, error.message);
      }
    }
  }

  /**
   * Pull a specific model
   */
  async pullModel(modelName) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/pull`, {
        name: modelName
      });
      
      // Wait for completion
      await this.waitForModel(modelName);
    } catch (error) {
      throw new Error(`Failed to pull model: ${error.message}`);
    }
  }

  /**
   * Wait for model to be ready
   */
  async waitForModel(modelName) {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
          model: modelName,
          prompt: 'test',
          stream: false
        });
        
        if (response.data.response) {
          return true;
        }
      } catch (error) {
        // Model not ready yet
      }
      
      attempts++;
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Model did not become ready in time');
  }

  /**
   * Test model functionality
   */
  async testModel(modelName) {
    try {
      console.log(`\n🧪 Testing ${modelName}...`);
      
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: modelName,
        prompt: 'What is PM Kisan scheme?',
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 100
        }
      });

      console.log('✅ Model test successful');
      console.log('Response:', response.data.response.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error(`❌ Model test failed:`, error.message);
      return false;
    }
  }

  /**
   * Test embedding model
   */
  async testEmbeddingModel(modelName) {
    try {
      console.log(`\n🧪 Testing embedding model ${modelName}...`);
      
      const response = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
        model: modelName,
        prompt: 'PM Kisan scheme for farmers'
      });

      if (response.data.embedding && response.data.embedding.length > 0) {
        console.log('✅ Embedding model test successful');
        console.log(`Embedding dimension: ${response.data.embedding.length}`);
        return true;
      } else {
        throw new Error('No embedding returned');
      }
    } catch (error) {
      console.error(`❌ Embedding model test failed:`, error.message);
      return false;
    }
  }

  /**
   * Format file size
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Run complete setup
   */
  async runSetup() {
    console.log('🚀 RuralConnect Local LLM Setup');
    console.log('================================\n');

    if (this.useOllama) {
      // Check Ollama status
      const isRunning = await this.checkOllamaStatus();
      if (!isRunning) {
        console.log('\n❌ Please start Ollama first:');
        console.log('   ollama serve');
        return;
      }

      // List current models
      await this.listModels();

      // Pull required models
      await this.pullModels();

      // Test models
      console.log('\n🧪 Testing models...');
      await this.testModel('llama2:7b');
      await this.testEmbeddingModel('nomic-embed-text');

      console.log('\n✅ Setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Start the backend: cd backend && npm run dev');
      console.log('2. Start the frontend: cd frontend && npm run dev');
      console.log('3. Test the chatbot at http://localhost:5173');

    } else {
      console.log('📦 Using Hugging Face Transformers');
      console.log('Models will be downloaded automatically on first use.');
      console.log('\nNext steps:');
      console.log('1. Install dependencies: cd backend && npm install');
      console.log('2. Start the backend: npm run dev');
      console.log('3. Start the frontend: cd frontend && npm run dev');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new LocalModelSetup();
  setup.runSetup().catch(console.error);
}

module.exports = LocalModelSetup;
