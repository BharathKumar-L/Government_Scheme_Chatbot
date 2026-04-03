# RuralConnect

RuralConnect is a full-stack web application for helping users discover and understand Indian government welfare schemes through a multilingual, RAG-style chatbot and a browsable schemes portal.

This repository contains:
- A Node.js/Express backend with chat, schemes, translation, training, and admin APIs.
- A React + Vite frontend (PWA) with chat, schemes listing, about page, and admin dashboard/login.
- Data and training assets for scheme ingestion, scraping, and vector search.

## What This Codebase Does

At a high level, the system is designed to:
- Accept user questions about government schemes.
- Retrieve relevant schemes using vector similarity search.
- Generate a contextual response via a selectable local/hosted LLM strategy.
- Support multilingual input/output (English, Hindi, Tamil).
- Let admins manage schemes manually or via dataset upload.
- Track training/scraping metadata for RAG pipeline maintenance.

### Backend behavior (observed)

Main server entry: `backend/server.js`
- Initializes Express with `helmet`, `cors`, `compression`, request logging, and rate limiting.
- Exposes:
  - `GET /health`
  - `POST/GET` routes under:
    - `/api/chat`
    - `/api/schemes`
    - `/api/translate`
    - `/api/training`
    - `/api/admin`
- Startup flow:
  - Attempts MongoDB connection first (`backend/services/mongodb.js`).
  - Falls back to file-based storage (`backend/services/database.js`) when MongoDB is unavailable.
  - Initializes vector DB (`backend/services/vectorDB.js`) with ChromaDB, with in-memory fallback.

Chat pipeline: `backend/routes/chat.js`
- Request validation with Joi.
- Optional translation to English before retrieval.
- Similarity search in vector DB for top matching schemes.
- Response generation through one of:
  - Ollama (`USE_OLLAMA=true`)
  - Hugging Face transformers (`USE_HUGGINGFACE=true`)
  - Simple local fallback (default)
- Optional translation back to user language.
- User query logging for analytics.

Schemes API: `backend/routes/schemes.js`
- List schemes with pagination/filtering/search.
- Scheme details by id.
- Category listing and category-specific retrieval.
- Search suggestions and stats endpoint.

Admin API: `backend/routes/admin.js`
- Session-based admin login/logout/verification.
- CRUD for schemes.
- Dataset upload (`.json`/`.csv`) with parsing and persistence.
- Upload/statistics reporting (MongoDB + file fallback behavior).

Training API: `backend/routes/training.js`
- Trigger training/retraining.
- Fetch fresh source data.
- Validation/testing helpers.
- Return scraping/training status.

Supporting services
- Data scraping from MyScheme/NSP/PM-Kisan stubs: `backend/services/dataScraper.js`
- RAG training orchestration: `backend/services/ragTrainer.js`
- Scheduled training service (cron): `backend/services/scheduledTraining.js`
- Translation abstraction with free-service fallback: `backend/services/translation.js`
- Vector storage/retrieval and embedding generation: `backend/services/vectorDB.js`

### Frontend behavior (observed)

Main app entry: `frontend/src/App.jsx`
- React Router-based pages:
  - `/` Chat
  - `/schemes` Schemes browser
  - `/about` About
  - `/admin/login` Admin login
  - `/admin` Admin dashboard
- Registers service worker (PWA behavior).
- Shows offline status indicator.

Chat page: `frontend/src/pages/ChatPage.jsx`
- Conversational UI with bot/user message stream.
- Calls backend chat API.
- Supports browser speech-to-text and text-to-speech.

Schemes page: `frontend/src/pages/SchemesPage.jsx`
- Loads schemes and categories from API.
- Client-side filter/search + detail modal.

Admin pages: `frontend/src/pages/AdminLoginPage.jsx`, `frontend/src/pages/AdminPage.jsx`
- Admin authentication flow.
- Scheme management UI (add/edit/delete).
- Dataset upload integration.

Internationalization: `frontend/src/i18n/i18n.js`
- English/Hindi/Tamil translation resources.
- Language detection and persistence via localStorage.

PWA: `frontend/vite.config.js`, `frontend/src/sw.js`, `frontend/src/services/pwa.js`
- Workbox-based service worker and runtime caching.

## Tech Stack Used

### Monorepo / Tooling
- npm workspaces-style orchestration via root scripts
- `concurrently` for running frontend + backend together

### Backend
- Runtime: Node.js
- Framework: Express.js
- Validation: Joi
- Security/Middleware: Helmet, CORS, compression, morgan, express-rate-limit
- Database:
  - Primary intended: MongoDB (Mongoose)
  - Fallback: file-based JSON storage
- Vector DB: ChromaDB (`chromadb` package)
- AI/Embeddings:
  - Ollama option
  - Hugging Face transformers option (`@xenova/transformers`)
  - local simple fallback mode
- Scraping/Data: Axios, Cheerio
- Scheduling: node-cron
- Uploads: multer
- Testing deps present: Jest, Supertest

### Frontend
- Framework: React 18
- Build tool: Vite
- Routing: react-router-dom
- Styling: Tailwind CSS + utility UI components
- UI primitives: Radix UI packages
- i18n: i18next + react-i18next + browser language detector
- Networking: Axios
- Notifications: react-hot-toast
- Icons: lucide-react
- PWA: vite-plugin-pwa + Workbox

## Project Structure (high-level)

- `backend/` API, services, models, local data files
- `frontend/` React PWA app
- `Datasets/` local CSV dataset(s)
- `DOCUMENTATION/` additional project docs/diagrams
- root scripts/tests for local checks and setup

## Run Locally (from current repo)

1. Install dependencies
```bash
npm run install:all
```

2. Configure environment files
- Copy `backend/env.example` to `backend/.env`
- Copy `frontend/env.example` to `frontend/.env`

3. Start both apps
```bash
npm run dev
```

4. Default local endpoints
- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:3001/api`
- Health: `http://localhost:3001/health`

## What Is Missing To Make This Codebase Complete

Based on code inspection, these are the most important gaps:

### 1) Data model consistency is incomplete
- `backend/models/Scheme.js` defines fields like `details`, `application`, and string `eligibility`.
- Chat/retrieval/services rely heavily on fields like `objective`, `applicationProcedure`, `documentsRequired`, multilingual arrays, `id`, `isActive`, `viewCount`, etc.
- This mismatch can cause runtime bugs and inconsistent behavior between file-based and MongoDB paths.

### 2) Route ordering bug risk in schemes API
- In `backend/routes/schemes.js`, `/:id` is registered before more specific routes such as `/categories/list` and `/search/suggestions`.
- In Express, this can shadow specific routes and return incorrect results.

### 3) “Coming soon” and non-persistent features
- Chat history endpoint currently returns placeholder response (`history: []`, message says coming soon).
- Chat feedback endpoint logs feedback but does not persist it to durable storage.

### 4) Scheduled training service is not wired into server startup
- `backend/services/scheduledTraining.js` is implemented, but no startup hook in `backend/server.js` currently starts it.

### 5) Security hardening needed for production
- Default admin credentials are exposed in code/UI and env template.
- Admin sessions are in-memory only (not durable/distributed).
- Password hashing uses SHA-256 directly rather than a password-hashing algorithm like bcrypt/argon2.

### 6) Frontend/back-end contract drift
- `frontend/src/services/api.js` sets base URL to `/api`, then `healthAPI.check()` requests `/health`, which resolves to `/api/health` instead of backend `GET /health`.
- About page mentions some technologies (for example OpenAI GPT-4, Google Translate API, Redis caching) that are not the active/default implementation shown in backend code.

### 7) CSV ingestion robustness is limited
- CSV parsing in admin upload path uses a simple split by commas and can break with quoted commas/complex CSV rows.
- There is a better CSV parser in trainer service, but upload path does not use it.

### 8) Testing and CI are not complete
- Test dependencies exist, but there is no clear, complete automated test suite and no CI pipeline config in this repository snapshot.
- Missing confidence checks for critical flows (chat response quality, admin CRUD, upload integrity, multilingual accuracy).

### 9) Deployment documentation is incomplete
- There is no root-level, production-ready deployment guide for required infra/services:
  - MongoDB setup
  - ChromaDB host lifecycle
  - Optional Ollama/HuggingFace model setup
  - reverse proxy/HTTPS configuration
  - environment hardening and secret management

## Suggested Definition of “Complete” for this repository

To consider this project production-complete, it should include:
- Unified canonical `Scheme` schema used consistently across all storage paths.
- Correct route ordering and endpoint contract validation tests.
- Persistent chat history + feedback storage.
- Production-grade auth/session strategy.
- Scheduler integration and operational controls.
- Strong CSV ingestion/parsing and validation.
- End-to-end tests + CI pipeline.
- Accurate and synchronized docs (code and About page claims aligned).

## License

The root `package.json` specifies MIT license.
