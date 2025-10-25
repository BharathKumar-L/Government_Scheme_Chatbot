# 🚀 Local LLM Setup Guide for RuralConnect

This guide will help you set up your own RAG model without using OpenAI. You have two options: **Ollama** (recommended) or **Hugging Face Transformers**.

## 🎯 Option 1: Ollama Setup (Recommended)

### Step 1: Install Ollama

**Windows:**
```powershell
# Download and install from https://ollama.ai
# Or use winget
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama Service
```bash
ollama serve
```

### Step 3: Pull Required Models
```bash
# Pull LLM model (choose one)
ollama pull llama2:7b        # Good balance of performance and quality
ollama pull mistral:7b       # Better performance
ollama pull codellama:7b     # Code-focused model

# Pull embedding model
ollama pull nomic-embed-text
```

### Step 4: Configure Environment
```bash
# Copy environment file
cp backend/env.example backend/.env

# Edit backend/.env
USE_OLLAMA=true
OLLAMA_URL=http://localhost:11434
LOCAL_MODEL=llama2:7b
EMBEDDING_MODEL=nomic-embed-text
```

### Step 5: Test Ollama
```bash
# Test if Ollama is working
curl http://localhost:11434/api/tags

# Test model
ollama run llama2:7b "Hello, how are you?"
```

## 🎯 Option 2: Hugging Face Transformers

### Step 1: Install Dependencies
```bash
cd backend
npm install @xenova/transformers sentence-transformers
```

### Step 2: Configure Environment
```bash
# Edit backend/.env
USE_OLLAMA=false
HF_LLM_MODEL=microsoft/DialoGPT-medium
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Step 3: Test Models
The models will be downloaded automatically on first use.

## 🚀 Running Your Local RAG System

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Start the Backend
```bash
npm run dev
```

### Step 3: Start the Frontend
```bash
cd frontend
npm run dev
```

## 📊 Model Comparison

| Model | Size | Quality | Speed | Memory | Use Case |
|-------|------|---------|-------|--------|----------|
| **llama2:7b** | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐ | 8GB | General purpose |
| **mistral:7b** | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 8GB | High quality |
| **codellama:7b** | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐ | 8GB | Code-focused |
| **DialoGPT-medium** | 345M | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 2GB | Lightweight |

## 🔧 Performance Optimization

### For Better Performance:
1. **Use GPU** (if available):
   ```bash
   # Install CUDA version
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

2. **Increase Memory**:
   ```bash
   # For Ollama
   export OLLAMA_NUM_PARALLEL=2
   export OLLAMA_MAX_LOADED_MODELS=2
   ```

3. **Use Quantized Models**:
   ```bash
   # Smaller, faster models
   ollama pull llama2:7b-q4_0
   ollama pull mistral:7b-q4_0
   ```

## 🛠️ Custom Model Training

### Fine-tuning for Government Schemes:

1. **Prepare Dataset**:
   ```json
   {
     "prompt": "What is PM Kisan scheme?",
     "completion": "PM Kisan Samman Nidhi is a government scheme that provides income support to farmers..."
   }
   ```

2. **Train Custom Model**:
   ```bash
   # Using Ollama
   ollama create my-gov-model -f Modelfile
   
   # Using Hugging Face
   python train_model.py --dataset government_schemes.json
   ```

## 🔍 Troubleshooting

### Common Issues:

1. **Ollama not starting**:
   ```bash
   # Check if port is in use
   netstat -an | findstr 11434
   
   # Kill existing process
   taskkill /f /im ollama.exe
   ```

2. **Out of memory**:
   ```bash
   # Use smaller model
   ollama pull llama2:7b-q4_0
   
   # Or reduce batch size
   export OLLAMA_NUM_PARALLEL=1
   ```

3. **Slow responses**:
   ```bash
   # Use GPU acceleration
   export OLLAMA_GPU_LAYERS=20
   
   # Or use faster model
   ollama pull mistral:7b
   ```

## 📈 Monitoring Performance

### Check Model Status:
```bash
# Ollama
curl http://localhost:11434/api/tags

# Check memory usage
ollama ps
```

### Log Analysis:
```bash
# Backend logs
cd backend
npm run dev

# Check response times in logs
grep "Response time" logs/app.log
```

## 🎯 Advanced Configuration

### Custom System Prompts:
Edit `backend/services/localLLM.js` to customize the system prompt for better government scheme responses.

### Vector Database Optimization:
```javascript
// In vectorDB.js
const embeddingSize = 384; // Adjust based on your model
const similarityThreshold = 0.7; // Adjust for better matching
```

### Caching Strategy:
```javascript
// Enable Redis caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600 // 1 hour
```

## 🚀 Production Deployment

### Docker Setup:
```bash
# Build with local models
docker-compose -f docker-compose.local.yml up -d
```

### Scaling:
- Use multiple Ollama instances
- Implement load balancing
- Use GPU servers for better performance

## 📞 Support

If you encounter issues:
1. Check the logs in `backend/logs/`
2. Verify model installation: `ollama list`
3. Test API endpoints: `curl http://localhost:3001/health`
4. Check memory usage: `ollama ps`

---

**Congratulations!** You now have a fully local RAG system that doesn't depend on external APIs! 🎉
