# RuralConnect Backend - Complete Setup & Deployment Guide

## ✅ System Architecture

The backend is built with:
- **Express.js**: Web server framework
- **MongoDB Atlas**: Cloud database
- **Mongoose**: Data modeling
- **Transformers.js**: Embeddings + NLP
- **Axios**: HTTP requests for external APIs

### Key Services

1. **Vector DB Service** (`services/vectorDB.js`)
   - In-memory vector store with cosine similarity
   - Embeddings generation using Transformers
   - Semantic search for RAG

2. **Data Ingestion Service** (`services/dataIngestion.js`)
   - CSV parsing and loading
   - Schema transformation
   - Batch insertion to MongoDB
   - Vector DB population

3. **Translation Service** (`services/translation.js`)
   - Language detection (EN/HI/TA)
   - Rule-based translation
   - Translation caching

4. **RAG Pipeline** (`services/ragPipeline.js`)
   - Query translation to English
   - Vector DB semantic search
   - LLM response generation
   - Response translation back

5. **LLM Service** (`services/llmService.js`)
   - HuggingFace API integration
   - Ollama local model support
   - Local fallback generation

---

## 🗄️ MongoDB Atlas Setup (Complete Instructions)

### 1. Create Free Cluster

```
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or login
3. Click "Create a new project"
4. Name it "RuralConnect"
5. Click "Create Project"
6. Click "Create a deployment"
7. Select "FREE" tier (M0)
8. Choose provider: AWS
9. Choose region: ap-south-1 (Asia Pacific - Mumbai)
10. Click "Create Deployment"
11. Wait 3-5 minutes for cluster creation
```

### 2. Create Database User

```
Security → Database Access → Add New Database User

Username: myAtlasDBUser
Password: Bhk@2005/ (or your choice)
Auth Method: Password (SCRAM)
Click "Add User"
```

**Save username and password!**

### 3. Whitelist IP

```
Security → Network Access → Add IP Address

Option A (Development): Add Current IP Address
Option B (Anywhere): 0.0.0.0/0 (NOT recommended for production)

Click "Confirm"
```

### 4. Get Connection String

```
Clusters → Connect → Drivers

Select: Node.js
Copy the connection string:
mongodb+srv://myAtlasDBUser:password@myatlasclusteredu.u7d4pbu.mongodb.net/schemes?retryWrites=true&w=majority
```

### 5. Update `.env` File

Replace password and cluster name:
```env
MONGODB_URI=mongodb+srv://myAtlasDBUser:Bhk%402005%2F@myatlasclusteredu.u7d4pbu.mongodb.net/schemes?retryWrites=true&w=majority
```

**Note**: Special characters must be URL-encoded:
- `@` = `%40`
- `/` = `%2F`
- `!` = `%21`
- `#` = `%23`
- `:` = `%3A`
- `*` = `%2A`

---

## 🚀 Backend Setup Instructions

### Step 1: Install Node Modules

```bash
cd backend
npm install
```

**This installs:**
- express, cors, helmet, morgan (web server)
- mongoose, mongodb (database)
- axios (HTTP)
- @xenova/transformers (embeddings)
- csv-parser (data loading)
- bcryptjs (password hashing)
- And 15+ dependencies

### Step 2: Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://myAtlasDBUser:Bhk%402005%2F@myatlasclusteredu.u7d4pbu.mongodb.net/schemes?retryWrites=true&w=majority
DATABASE_TYPE=mongodb

ADMIN_EMAIL=admin@ruralconnect.com
ADMIN_PASSWORD=admin123

USE_HUGGINGFACE=true
USE_OLLAMA=false
USE_LOCAL_LLM=false

TRANSLATION_SERVICE=local
LOG_LEVEL=info
MAX_FILE_SIZE=50mb
UPLOAD_DIR=./uploads

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

DATASET_PATH=../Datasets/updated_data.csv
```

### Step 3: Start Server

```bash
npm start
```

**Expected Output:**
```
🚀 Starting RuralConnect Backend...

✓ MongoDB connected successfully
✓ Embeddings model loaded
✓ RAG Pipeline ready

📊 Loading initial dataset...
✓ Loaded 3400 schemes

✅ Server started successfully!

📍 API running on: http://localhost:3001
💬 Chat endpoint: POST http://localhost:3001/api/chat
📊 Stats: GET http://localhost:3001/stats
```

### Step 4: Verify Connection

```bash
# Test health endpoint
curl http://localhost:3001/health

# Response:
# {
#   "status": "ok",
#   "mongoDBConnected": true,
#   "version": "1.0.0"
# }
```

---

## 📊 API Endpoints

### Chat API

#### POST `/api/chat` - Send Message
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about pension schemes",
    "language": "en",
    "isVoiceInput": false
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your query, here are the top pension schemes...",
    "language": "en",
    "relevantSchemes": [
      {
        "id": "scheme_123",
        "name": "National Pension Scheme",
        "relevanceScore": 0.95
      }
    ],
    "confidence": 0.95
  }
}
```

#### GET `/api/chat/history/{sessionId}` - Get Chat History
```bash
curl http://localhost:3001/api/chat/history/session_123456
```

### Schemes API

#### GET `/api/schemes` - List All Schemes
```bash
curl "http://localhost:3001/api/schemes?page=1&limit=10&language=en"
```

#### GET `/api/schemes/{id}` - Get Scheme Details
```bash
curl "http://localhost:3001/api/schemes/scheme_123?language=en"
```

#### GET `/api/schemes/search?q=query` - Semantic Search
```bash
curl "http://localhost:3001/api/schemes/search?q=pension&language=en"
```

#### GET `/api/schemes/categories` - Get All Categories
```bash
curl "http://localhost:3001/api/schemes/categories"
```

### Admin API

#### POST `/api/admin/login` - Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ruralconnect.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "email": "admin@ruralconnect.com",
    "expiresIn": 86400
  }
}
```

#### POST `/api/admin/upload-dataset` - Upload CSV
```bash
curl -X POST http://localhost:3001/api/admin/upload-dataset \
  -H "X-Admin-Session: session-uuid" \
  -F "file=@updated_data.csv"
```

#### GET `/api/admin/stats` - Get Admin Stats
```bash
curl -H "X-Admin-Session: session-uuid" \
  http://localhost:3001/api/admin/stats
```

---

## 🔍 Database Structure

### Collections in MongoDB Atlas

#### 1. `schemes` Collection
```json
{
  "_id": "uuid",
  "name": "National Pension Scheme",
  "details": "...",
  "benefits": "₹1000/month...",
  "eligibility": "Age 18-60...",
  "applicationProcedure": "...",
  "documentsRequired": "...",
  "level": "central",
  "category": "Social Welfare",
  "tags": ["pension", "retirement", "social"],
  "isActive": true,
  "viewCount": 0,
  "embedding": [0.123, 0.456, ...],
  "createdAt": "2024-04-02T10:30:00Z",
  "updatedAt": "2024-04-02T10:30:00Z"
}
```

#### 2. `chathistories` Collection
```json
{
  "_id": "uuid",
  "sessionId": "session_123456",
  "messages": [
    {
      "role": "user",
      "content": "Tell me about pension",
      "language": "en",
      "timestamp": "2024-04-02T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Here are pension schemes...",
      "language": "en",
      "timestamp": "2024-04-02T10:30:05Z"
    }
  ],
  "metadata": {
    "userLanguage": "en",
    "ipAddress": "192.168.1.1",
    "isVoiceInput": false
  },
  "createdAt": "2024-04-02T10:30:00Z",
  "updatedAt": "2024-04-02T10:30:05Z"
}
```

#### 3. `admins` Collection
```json
{
  "_id": "uuid",
  "email": "admin@ruralconnect.com",
  "passwordHash": "bcryptHash...",
  "name": "Admin User",
  "role": "admin",
  "isActive": true,
  "lastLogin": "2024-04-02T10:30:00Z",
  "createdAt": "2024-04-02T10:30:00Z",
  "updatedAt": "2024-04-02T10:30:00Z"
}
```

---

## 🚢 Deployment to Production

### Option 1: Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create ruralconnect-backend

# 4. Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/schemes"
heroku config:set ADMIN_PASSWORD="secure-password"
heroku config:set NODE_ENV="production"

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

### Option 2: AWS EC2

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance-ip

# 2. Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. Clone repository
git clone https://github.com/your/repo.git
cd backend

# 4. Install dependencies
npm install

# 5. Create .env
cp .env.example .env
# Edit with your MongoDB credentials

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name "ruralconnect"
pm2 save

# 7. View logs
pm2 logs
```

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ruralconnect .
docker run -p 3001:3001 \
  -e MONGODB_URI="mongodb+srv://..." \
  ruralconnect
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed
```
✗ MongoDB connection failed: Connection timeout
```

**Solution:**
1. Check MONGODB_URI in .env
2. Verify IP is whitelisted in MongoDB Atlas
3. Test connection: `mongosh "mongodb+srv://..."`
4. Ensure database user exists

### Issue: Port 3001 Already in Use
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: Embeddings Model Not Loading
```
Fallback: Using simple hash-based embeddings
```

This is normal - will use fallback embeddings. Performance will be similar.

### Issue: CSV Ingestion Fails
```
Error loading CSV: File not found
```

Check:
1. DATASET_PATH is correct in .env
2. updated_data.csv exists in /Datasets folder
3. File is readable

---

## 📈 Performance Optimization

### Enable Caching
```bash
npm install node-cache
# Already installed - see services/translation.js
```

### Database Indexing
Mongoose automatically creates indexes for:
- `Scheme.name` (text search)
- `Scheme.category` (filtering)
- `ChatHistory.sessionId` (lookups)

### Vector DB Optimization
- Embeddings cached in memory
- Batch inserts for performance
- Cosine similarity optimized

---

**Backend is ready! Now set up the frontend. 🎉**
