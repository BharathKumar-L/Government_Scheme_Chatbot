# 🚀 RuralConnect - Quick Start Guide

Get the entire RAG chatbot system up and running in 10 minutes!

---

## ⚡ Prerequisites (5 minutes)

1. **Install Node.js**: https://nodejs.org/
   - Download v18 or latest LTS
   - Verify: `node --version` (should show v18+)

2. **Create MongoDB Atlas Account**:
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up (free)
   - Create a cluster (M0 Free tier)
   - Create a database user
   - Get connection string

3. **Clone/Setup Repository**:
   ```bash
   cd d:/FINAL YEAR PROJECT
   ```

---

## 🔧 Step 1: Backend Setup (3 minutes)

### 1A: Install Dependencies
```bash
cd backend
npm install
```

### 1B: Configure MongoDB
Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/schemes?retryWrites=true&w=majority
```

**Note**: URL-encode special characters in password:
- `@` → `%40`
- `/` → `%2F`

### 1C: Start Backend
```bash
npm start
```

Wait for: `✅ Server started successfully!`

✅ **Backend running on http://localhost:3001**

---

## 🎨 Step 2: Frontend Setup (2 minutes)

### 2A: Install Dependencies
```bash
cd frontend
npm install
```

### 2B: Create Environment File
Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2C: Start Frontend
```bash
npm run dev
```

Wait for: `➜  Local:   http://localhost:5173/`

✅ **Frontend running on http://localhost:5173**

---

## 📱 Step 3: Try It Out!

### Open Browser
Navigate to: http://localhost:5173/

### Test Chat
1. Type: "Tell me about pension schemes"
2. Click Send
3. See AI response with relevant schemes

### Test Voice
1. Click microphone icon
2. Speak: "पेंशन योजना के बारे में बताएं"
3. Hear response in Hindi

### Test Admin
1. Go to Admin → Login
2. Email: `admin@ruralconnect.com`
3. Password: `admin123`
4. Upload schemes or view stats

---

## 📊 System Status

### Backend Checklist
- [ ] Node.js installed
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] .env file configured with MONGODB_URI
- [ ] `npm install` completed
- [ ] `npm start` running
- [ ] Health check passes: http://localhost:3001/health

### Frontend Checklist
- [ ] Node.js installed
- [ ] .env.local created with API URL
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Page loads: http://localhost:5173/
- [ ] Chat works
- [ ] Voice input/output works

---

## 🔌 API Quick Reference

### Chat Endpoint
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "government schemes",
    "language": "en"
  }'
```

### Schemes Endpoint
```bash
curl http://localhost:3001/api/schemes?limit=10
```

### Health Check
```bash
curl http://localhost:3001/health
```

---

## 🌐 Languages Supported

| Language | Code | Status |
|----------|------|--------|
| English | en | ✅ Full Support |
| Hindi | hi | ✅ Full Support |
| Tamil | ta | ✅ Full Support |

Voice input/output works in all three languages!

---

## 🐛 Quick Troubleshooting

### "MongoDB connection failed"
- [ ] Check MONGODB_URI in .env
- [ ] Verify database user exists
- [ ] Whitelist your IP in MongoDB Atlas
- [ ] Restart backend

### "Can't connect to backend"
- [ ] Verify backend running on :3001
- [ ] Check VITE_API_BASE_URL in .env.local
- [ ] Look for CORS errors in browser console

### "Voice not working"
- [ ] Use Chrome/Firefox (best support)
- [ ] Allow microphone permission
- [ ] Check browser console for errors

### "Port already in use"
```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port:
PORT=3002 npm start
```

---

## 📚 Full Documentation

- **Backend Setup**: See `BACKEND_SETUP_COMPLETE.md`
- **Frontend Setup**: See `FRONTEND_SETUP_COMPLETE.md`
- **Deployment**: See deployment sections in guides

---

## 🎯 What You Get

✅ **3400+ Government Schemes**:
- Social Welfare
- Health & Family
- Education
- Agriculture
- Business & Entrepreneurship
- And 30+ categories

✅ **AI-Powered Responses**:
- Semantic search using embeddings
- RAG pipeline for accuracy
- LLM generation for natural responses

✅ **Voice Interaction**:
- Speech recognition (input)
- Text-to-speech (output)
- Multiple languages

✅ **Multilingual Support**:
- Automatic language detection
- Instant translation
- Voice adapts to language

✅ **Admin Dashboard**:
- Manage schemes
- Upload datasets
- View statistics

---

## 🚀 Next Steps

1. **Test the chatbot**: Try asking questions in different languages
2. **Explore schemes**: Browse all government programs
3. **Check admin panel**: Upload custom datasets
4. **Deploy**: Follow deployment guide for production

---

## 📞 Need Help?

1. Check the full setup guides above
2. Review error logs in console
3. Check API endpoints in browser DevTools
4. Verify MongoDB connection status

---

**Happy chatting! 🎉**

**System Uptime**: Backend ✅ | Frontend ✅ | Database ✅
