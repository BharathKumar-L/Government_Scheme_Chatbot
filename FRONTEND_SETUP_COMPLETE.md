# RuralConnect Frontend - Complete Setup & Usage Guide

## ✨ Key Features

The frontend provides:
- ✅ Real-time chat interface with voice support
- ✅ Multilingual UI (English, Hindi, Tamil)
- ✅ Voice input via Web Speech API
- ✅ Voice output (Text-to-Speech)
- ✅ Scheme browsing and search
- ✅ Admin dashboard
- ✅ PWA support (offline capability)
- ✅ Responsive design (mobile, tablet, desktop)

---

## 🛠️ Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

**Installs:**
- React 18: UI framework
- Vite: Build tool
- React Router: Navigation
- Axios: API calls
- i18next: Multilingual support
- Tailwind CSS: Styling
- Lucide React: Icons
- React Hot Toast: Notifications

### Step 2: Create Environment File

Create `frontend/.env.local`:

```env
# Development environment
VITE_API_BASE_URL=http://localhost:3001/api

# Production environment (optional)
# VITE_API_BASE_URL=https://api.ruralconnect.com/api
```

### Step 3: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 4: Open in Browser

Navigate to:
```
http://localhost:5173/
```

---

## 📱 Using the Application

### 1. Chat Page (Main Interface)

**Features:**
- Send text messages
- Voice input (click microphone)
- Voice output (click speaker)
- See related schemes for each response
- Session management

**How to Use:**
```
1. Type or speak a question about government schemes
2. Press Enter or click Send button
3. Get AI-powered response with relevant schemes
4. Response is read aloud automatically
5. Scroll for chat history
```

**Voice Controls:**
- 🎤 Microphone icon: Start/stop voice input
- 🔊 Speaker icon: Speak/stop audio output
- ⏹️ Mute icon: Stop current speech

### 2. Schemes Page (Browse)

**Features:**
- Browse all 3400+ government schemes
- Filter by category
- Search by keywords
- View detailed scheme information
- Get application procedures
- See eligibility criteria

**Categories Available:**
- Social Welfare & Empowerment
- Agriculture, Rural & Environment
- Business & Entrepreneurship
- Education & Learning
- Health & Family Welfare
- And 30+ more...

### 3. Languages (EN/HI/TA)

**Switch Language:**
1. Click language selector (top-right)
2. Choose: English / हिन्दी / தமிழ்
3. UI instantly updates
4. Chat history translates automatically
5. Voice auto-adapts to language

**Language Support:**
- **English**: Full support
- **Hindi**: Devanagari script
- **Tamil**: Tamil script

### 4. Admin Dashboard

**Access:**
```
1. Click "Admin" in navigation
2. Click "Login"
3. Enter credentials:
   - Email: admin@ruralconnect.com
   - Password: admin123
4. Access admin panel
```

**Admin Features:**
- 📊 View platform statistics
- ➕ Add new schemes
- ✏️ Edit existing schemes
- 🗑️ Delete schemes
- 📤 Upload CSV datasets
- 📈 View user statistics

---

## 📁 Frontend Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── sw.js                  # Service worker (PWA)
│   │
│   ├── components/
│   │   ├── Header.jsx         # Navigation header
│   │   ├── LoadingSpinner.jsx # Loading UI
│   │   ├── AdminSchemeForm.jsx
│   │   ├── AdminStats.jsx
│   │   │
│   │   └── ui/                # Reusable UI components
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── input.jsx
│   │       └── select.jsx
│   │
│   ├── pages/
│   │   ├── ChatPage.jsx       # Main chat interface
│   │   ├── SchemesPage.jsx    # Browse schemes
│   │   ├── AboutPage.jsx      # About RuralConnect
│   │   ├── AdminLoginPage.jsx
│   │   └── AdminPage.jsx
│   │
│   ├── services/
│   │   ├── api.js             # API client + endpoints
│   │   ├── voice.js           # Web Speech API wrapper
│   │   └── pwa.js             # PWA service worker
│   │
│   ├── i18n/
│   │   └── i18n.js            # i18next configuration
│   │                           # EN/HI/TA translations
│   └── lib/
│       └── utils.js           # Utility functions
│
├── .env.local                 # Environment variables
├── .env.production            # Production config
├── vite.config.js            # Vite configuration
├── tailwind.config.js         # Tailwind setup
├── postcss.config.js          # PostCSS setup
└── package.json               # Dependencies
```

---

## 🎨 UI Components

### Chat Interface
```jsx
// Message bubbles
User messages: Blue background, right-aligned
Bot messages: Gray background, left-aligned, with icons

// Input area
Text input field with placeholder
Microphone button (for voice input)
Send button
Speaker button (for voice output)
```

### Scheme Card
```jsx
// Each scheme shows:
- Scheme name
- Category
- Brief description
- View Details link
- Eligibility badge
- Benefits preview
```

### Language Selector
```jsx
// Top-right corner
EN | हिन्दी | தமிழ்
Click to switch language instantly
```

---

## 🔌 API Integration

### API Client (services/api.js)

```javascript
// Chat API
import { chatAPI } from '../services/api'

// Send message
const response = await chatAPI.sendMessage({
  message: "Tell me about pensions",
  language: "en",
  sessionId: "session_123"
})

// Get history
const history = await chatAPI.getHistory(sessionId)

// Submit feedback
await chatAPI.submitFeedback({
  sessionId: "session_123",
  rating: 5,
  comment: "Very helpful!"
})
```

### Schemes API
```javascript
import { schemesAPI } from '../services/api'

// Get all schemes
const schemes = await schemesAPI.getAllSchemes({
  page: 1,
  limit: 10,
  category: "Social Welfare"
})

// Get scheme details
const scheme = await schemesAPI.getSchemeById("scheme_123", "en")

// Search
const results = await schemesAPI.searchSchemes("pension", {
  language: "en",
  limit: 5
})

// Get categories
const categories = await schemesAPI.getCategories()
```

---

## 🎤 Voice Features

### Voice Input (Speech-to-Text)

```javascript
import { voiceService } from '../services/voice'

// Check support
if (voiceService.isRecognitionSupported()) {
  // Start listening
  const text = await voiceService.startListening({
    language: 'hi-IN',
    onResult: (result) => {
      console.log(result.transcript)
    }
  })
}
```

### Voice Output (Text-to-Speech)

```javascript
// Speak text
await voiceService.speak("नमस्ते, मैं कैसे मदद कर सकता हूं?", {
  language: 'hi-IN',
  rate: 0.9,
  pitch: 1,
  onStart: () => console.log('Speaking...'),
  onEnd: () => console.log('Done')
})

// Stop speech
voiceService.stopSpeaking()

// Pause/Resume
voiceService.pauseSpeech()
voiceService.resumeSpeech()
```

### Browser Support

| Browser | Speech-to-Text | Text-to-Speech |
|---------|---|---|
| Chrome/Edge | ✅ Yes | ✅ Yes |
| Firefox | ✅ Yes | ✅ Yes |
| Safari | ✅ Yes | ✅ Yes |
| Opera | ✅ Yes | ✅ Yes |

---

## 🌐 Internationalization (i18n)

### Translation Configuration

```javascript
// i18n/i18n.js contains translations for:
- Navigation (nav.*)
- Chat interface (chat.*)
- Schemes page (schemes.*)
- About page (about.*)
- Common UI (common.*)
```

### Adding Translations

Edit `src/i18n/i18n.js`:

```javascript
const resources = {
  en: {
    translation: {
      chat: {
        title: "Government Schemes Chatbot",
        subtitle: "..."
      }
    }
  },
  hi: {
    translation: {
      chat: {
        title: "सरकारी योजना चैटबॉट",
        subtitle: "..."
      }
    }
  },
  ta: {
    translation: {
      chat: {
        title: "அரசு திட்டம் அரட்டை போட்",
        subtitle: "..."
      }
    }
  }
}
```

### Using Translations in Components

```jsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('chat.title')}</h1>
      <p>{t('chat.subtitle')}</p>

      <button onClick={() => i18n.changeLanguage('hi')}>
        हिन्दी
      </button>
    </div>
  )
}
```

---

## 🏗️ Build for Production

### Build Static Files

```bash
npm run build
```

**Output:**
```
✓ 234 modules transformed
✓ built in 12.34s
dist/
├── index.html
├── assets/
│   ├── index-XYZ.js (bundled JavaScript)
│   ├── index-ABC.css (bundled CSS)
│   └── ...
```

### Preview Production Build

```bash
npm run preview
```

Opens production build locally at `http://localhost:4173/`

---

## 🚀 Deployment (Frontend Only)

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# When prompted, set:
# VITE_API_BASE_URL = https://api.yourdomain.com/api
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variable in dashboard:
# VITE_API_BASE_URL = https://api.yourdomain.com/api
```

### Option 3: GitHub Pages

```bash
# Update vite.config.js
export default {
  base: '/ruralconnect/'
}

# Build
npm run build

# Deploy dist folder to gh-pages branch
```

---

## 🔧 Development

### Run with Hot Module Replacement

```bash
npm run dev
```

Changes auto-reload in browser.

### Code Linting

```bash
npm run lint
```

Check for code quality issues.

### Debug in Browser

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors and warnings
4. Network tab to see API calls

---

## ⚡ Performance Tips

1. **Enable Caching**: Browser cache voice inputs/outputs
2. **Lazy Loading**: Pages load on-demand
3. **Code Splitting**: Reduce initial bundle size
4. **Image Optimization**: Lucide icons are lightweight
5. **PWA Support**: Works offline after first load

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-router-dom | ^6.20.1 | Routing |
| axios | ^1.6.2 | HTTP requests |
| i18next | ^23.7.6 | Translations |
| tailwindcss | ^3.3.6 | Styling |
| lucide-react | ^0.294.0 | Icons |
| workbox-window | ^7.0.0 | PWA support |

---

## 🐛 Troubleshooting

### Issue: Can't Connect to Backend
**Error:** "Network error. Please check your connection"

**Solution:**
1. Verify backend running: `curl http://localhost:3001/health`
2. Check VITE_API_BASE_URL in .env.local
3. Check browser console for CORS errors

### Issue: Voice Not Working
**Error:** "Speech Recognition not supported"

**Solution:**
1. Use Chrome/Firefox/Edge (Safari has limited support)
2. Ensure HTTPS in production (required by Web Speech API)
3. Allow microphone permission
4. Check browser settings

### Issue: Slow Translations
**Solution:** Normal on first request (translation cached after). Subsequent requests instant.

### Issue: Pages Not Loading
**Error:** "Failed to load page"

**Solution:**
1. Check React Router configuration
2. Verify all import paths
3. Check for circular dependencies
4. View browser console errors

---

**Frontend is ready! Both backend and frontend working together. 🎉**
