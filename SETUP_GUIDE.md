# RuralConnect - RAG Chatbot Backend Setup

## Project Overview

RuralConnect is a multilingual RAG (Retrieval-Augmented Generation) chatbot system designed to help users discover and understand Indian government welfare schemes. It features:

- **Multilingual Support**: English, Hindi, and Tamil
- **Voice Input/Output**: Using Web Speech API
- **RAG Architecture**: Vector-based semantic search of government schemes
- **Admin Dashboard**: Manage schemes and upload datasets
- **Chat History**: Persistent chat history across sessions

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with file-based fallback)
- **Vector DB**: In-memory vector store with embeddings
- **AI Models**: HuggingFace transformers (optional Ollama support)
- **Security**: Helmet, CORS, Rate limiting, bcrypt

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **i18n**: react-i18next for multilingual support
- **Voice**: Web Speech API (no external dependencies)
- **Storage**: LocalStorage for sessions

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (optional, will use file-based storage if unavailable)

### Step 1: Clone and Install Dependencies

```bash
# From project root
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

**Backend** - `/backend/.env`:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/ruralconnect

# Admin credentials
ADMIN_EMAIL=admin@ruralconnect.com
ADMIN_PASSWORD=admin123

# LLM Configuration
USE_HUGGINGFACE=true
USE_OLLAMA=false

DATASET_PATH=../Datasets/updated_data.csv
```

**Frontend** - `/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 3: Start the Services

**Start Backend** (Terminal 1):
```bash
cd backend
npm start
# Server will start on http://localhost:3001
```

**Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App will start on http://localhost:5173
```

## API Documentation

### Chat API

#### POST `/api/chat`
Send a message to the chatbot.

**Request:**
```json
{
  "message": "What are government schemes for farmers?",
  "language": "en",
  "isVoiceInput": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "response": "Based on your query, I found...",
    "language": "en",
    "relevantSchemes": [
      {
        "id": "scheme_id",
        "name": "Scheme Name",
        "relevanceScore": 0.95
      }
    ],
    "confidence": 0.95
  }
}
```

#### GET `/api/chat/history/:sessionId`
Get chat history for a session.

#### POST `/api/chat/feedback`
Submit feedback on chat responses.

### Schemes API

#### GET `/api/schemes`
List all government schemes with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `category`: Filter by category
- `language`: Response language (en, hi, ta)

#### GET `/api/schemes/:id`
Get detailed information about a specific scheme.

#### GET `/api/schemes/categories`
Get list of all scheme categories.

#### GET `/api/schemes/search`
Search schemes using vector-based semantic search.

**Query Parameters:**
- `q`: Search query (required)
- `language`: en, hi, ta
- `limit`: Maximum results (default: 10)

### Admin API

#### POST `/api/admin/login`
Admin login.

**Request:**
```json
{
  "email": "admin@ruralconnect.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_id",
    "expiresIn": 86400
  }
}
```

#### POST `/api/admin/upload-dataset`
Upload CSV dataset (requires admin session).

**Headers:**
```
x-admin-session: session_id
```

**Form Data:**
```
file: <csv_file>
```

#### POST `/api/admin/schemes`
Create new scheme (requires admin session).

#### PUT `/api/admin/schemes/:id`
Update scheme (requires admin session).

#### DELETE `/api/admin/schemes/:id`
Delete scheme (requires admin session).

#### GET `/api/admin/stats`
Get admin statistics (requires admin session).

### Health Check

#### GET `/health`
Check server health status.

## Using Voice Features

### Frontend Integration

The voice service is available at `src/services/voice.js`:

```javascript
import { voiceService } from './services/voice'

// Check support
if (voiceService.isRecognitionSupported()) {
  // Listen to user voice
  voiceService.startListening({
    language: 'en',
    onResult: (result) => {
      console.log('Interim:', result.transcript)
    }
  })
}

// Speak to user
await voiceService.speak('Hello! How can I help you?', {
  language: 'en',
  rate: 1
})

// Stop speaking
voiceService.stopSpeaking()
```

## Data Ingestion

### CSV Format

The system expects CSV files with the following columns:
- `name`: Scheme name (required)
- `details`: Scheme details
- `benefits`: Benefits description
- `eligibility`: Eligibility criteria
- `application`: Application procedure
- `documents`: Required documents
- `level`: central, state, or district
- `category`: Scheme category
- `tags`: Comma-separated tags

### Load Data

**Option 1: Automatic on startup**
Place CSV file at `Datasets/updated_data.csv` - it will load automatically when server starts.

**Option 2: Via Admin Dashboard**
1. Login to admin panel
2. Upload CSV file through the upload interface

**Option 3: Via API**
```bash
curl -X POST http://localhost:3001/api/ingest-data \
  -H "x-admin-session: session_id"
```

## Multilingual Support

The system supports three languages:
- **English (en)**
- **Hindi (hi)**
- **Tamil (ta)**

Language is auto-detected from user input but can be specified in requests:
- Chat API: `language` parameter
- Voice: Auto-detected or set via language option
- Frontend: Set in language selector

## Troubleshooting

### MongoDB Connection Fails
- Check if MongoDB is running: `mongod`
- Or let the system fall back to file-based storage
- File storage is slower but works offline

### Vector DB Not Loading Data
- Ensure CSV file is at correct path
- Check CSV format matches expected columns
- Check console for error messages

### Voice Input Not Working
- Supported browsers: Chrome, Firefox, Edge, Safari
- Requires HTTPS in production
- Check microphone permissions

### API Connection Errors
From frontend check:
1. Backend is running on port 3001
2. CORS is configured correctly
3. Frontend .env has correct API URL

## Production Deployment

### Security Checklist
- [ ] Change default admin credentials
- [ ] Enable HTTPS
- [ ] Set strong database passwords
- [ ] Configure production MongoDB
- [ ] Use environment secrets (not in .env)
- [ ] Set NODE_ENV=production
- [ ] Configure proper rate limiting
- [ ] Enable helmet security headers

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb://prod-db:27017/production
USE_OLLAMA=false
DEBUG=false
```

## Project Structure

```
├── backend/
│   ├── models/           # Database schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── server.js        # Main entry point
│   └── .env            # Configuration
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # React components
│   │   ├── services/    # API & voice services
│   │   ├── i18n/        # Translations
│   │   └── App.jsx     # App component
│   └── .env            # Frontend config
└── Datasets/
    └── updated_data.csv # Government schemes data
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues and questions, refer to GitHub issues or check the documentation folder.
