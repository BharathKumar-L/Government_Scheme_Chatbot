# RuralConnect: RAG-based Multilingual Chatbot for Government Schemes

A Progressive Web App (PWA) that helps citizens in rural and underserved areas access accurate, up-to-date information on government welfare schemes through an intelligent multilingual chatbot.

## 🚀 Features

- **RAG-based Chatbot**: Intelligent question-answering using Retrieval-Augmented Generation
- **Multilingual Support**: English + 2 regional languages (Hindi, Tamil)
- **Voice Interaction**: Speech-to-Text and Text-to-Speech capabilities
- **Offline Support**: Works without internet for previously accessed schemes
- **PWA**: Installable app optimized for low-end smartphones
- **Comprehensive Database**: Central and state government schemes

## 🏗️ Architecture

### Frontend (React PWA)
- **Framework**: React + Vite
- **UI**: ShadCN/UI components
- **PWA**: Service Workers + Manifest
- **Voice**: Web Speech API
- **Multilingual**: i18next

### Backend (Node.js)
- **Framework**: Express.js
- **AI/NLP**: OpenAI GPT-4 + Sentence Transformers
- **Vector DB**: Chroma (local) / Pinecone (production)
- **Translation**: Google Translate API
- **Caching**: Redis

## 📁 Project Structure

```
ruralconnect/
├── frontend/          # React PWA
├── backend/           # Node.js API
├── data/             # Government scheme datasets
└── docs/             # Documentation
```

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🔧 Environment Setup

Create `.env` files in both frontend and backend directories with required API keys:

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
REDIS_URL=your_redis_url
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## 📱 PWA Features

- **Installable**: Add to home screen
- **Offline**: Cached responses for previously accessed schemes
- **Responsive**: Optimized for mobile devices
- **Fast**: Service worker caching

## 🌐 Supported Languages

- English (Primary)
- Hindi (हिंदी)
- Tamil (தமிழ்)

## 📊 Data Sources

- MyScheme.gov.in
- State government portals
- Official scheme PDFs and documents

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production
```bash
npm run build
```

## 📄 API Endpoints

- `POST /api/chat` - Chat with the RAG bot
- `GET /api/schemes` - List all schemes
- `GET /api/schemes/:id` - Get specific scheme details
- `POST /api/translate` - Translate text
- `GET /api/languages` - Get supported languages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions, please open an issue in the repository.
