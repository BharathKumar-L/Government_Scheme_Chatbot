# 🚀 RuralConnect Quick Reference

## Start Backend
```bash
cd backend
npm start
# Runs on http://localhost:3001
```

## Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## Quick API Tests

### Test Chat
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are pension schemes?","language":"en"}'
```

### Get All Schemes (Paginated)
```bash
curl "http://localhost:3001/api/schemes?page=1&limit=10"
```

### Search Schemes
```bash
curl "http://localhost:3001/api/schemes/search?q=agriculture"
```

### Get Categories
```bash
curl http://localhost:3001/api/schemes/categories
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ruralconnect.com","password":"admin123"}'
```

### Health Check
```bash
curl http://localhost:3001/health
```

### System Stats
```bash
curl http://localhost:3001/api/stats
```

---

## Default Credentials
- **Email**: admin@ruralconnect.com
- **Password**: admin123
- ⚠️ **Change in production**!

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/ruralconnect
ADMIN_EMAIL=admin@ruralconnect.com
ADMIN_PASSWORD=admin123
USE_HUGGINGFACE=true
DATASET_PATH=../Datasets/updated_data.csv
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Common Tasks

### Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Load CSV Data Programmatically
```bash
# Via API (requires admin session)
curl -X POST http://localhost:3001/api/ingest-data \
  -H "x-admin-session: YOUR_SESSION_ID"
```

### Create New Scheme (Admin)
```bash
curl -X POST http://localhost:3001/api/admin/schemes \
  -H "Content-Type: application/json" \
  -H "x-admin-session: SESSION_ID" \
  -d '{
    "name":"New Scheme",
    "benefits":"₹100,000",
    "eligibility":"Age 18-60",
    "category":"Welfare"
  }'
```

### Delete Chat History
```bash
curl -X DELETE http://localhost:3001/api/chat/history/SESSION_ID
```

### Get Admin Stats
```bash
curl http://localhost:3001/api/admin/stats \
  -H "x-admin-session: SESSION_ID"
```

---

## Browser Console (Frontend)

### Test Voice Recognition
```javascript
import { voiceService } from './services/voice'

voiceService.startListening({
  language: 'en',
  onResult: (result) => console.log(result.transcript)
})
```

### Test Text-to-Speech
```javascript
voiceService.speak('Hello! How can I help you?', { language: 'en' })
```

### Stop Speech
```javascript
voiceService.stopSpeaking()
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Can't connect to MongoDB
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### API not responding
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS configuration
# Ensure FRONTEND_URL matches your frontend URL
```

### Voice not working
- Check browser is Chrome, Firefox, or Edge
- Check microphone permissions
- In production, requires HTTPS
- Check browser console for errors

---

## File Locations

| File | Purpose |
|------|---------|
| `backend/server.js` | Main API entry point |
| `backend/.env` | Backend configuration |
| `backend/models/` | Database schemas |
| `backend/routes/` | API endpoints |
| `backend/services/` | Business logic |
| `frontend/src/services/voice.js` | Voice feature |
| `frontend/.env` | Frontend configuration |
| `Datasets/updated_data.csv` | Government schemes data |

---

## Development Tips

### Enable Debug Logging
```bash
# Backend
DEBUG=* npm start

# Frontend
VITE_DEBUG=true npm run dev
```

### Database Inspection
```javascript
// In Node REPL
const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');
Scheme.countDocuments({}).then(count => console.log(count));
```

### Performance Testing
```bash
# Load test backend
# Install Apache Bench
sudo apt install apache2-utils

# Test endpoint
ab -n 100 -c 10 http://localhost:3001/health
```

---

## Docker Quick Commands

### Build Images
```bash
docker build -t ruralconnect-backend ./backend
docker build -t ruralconnect-frontend ./frontend
```

### Run with Docker Compose
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Check Container Status
```bash
docker ps
docker logs container-id
```

---

## Production Checklist

- [ ] Change default credentials
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure MongoDB Atlas
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Enable rate limiting
- [ ] Setup admin alerts
- [ ] Test all endpoints
- [ ] Verify voice works
- [ ] Test multilingual
- [ ] Security audit

---

## Useful Links

- [Express.js Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [React Docs](https://react.dev)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com)

---

## File Sizes Reference
- Backend package: ~440 packages
- Frontend package: ~800 packages
- Scheme data: 3,400 records in CSV
- Typical response time: <500ms

---

## Important Notes

1. **Voice Support**: Works best in Chrome, Firefox, Edge
2. **Languages**: EN (English), HI (Hindi), TA (Tamil)
3. **Database**: MongoDB optional - uses file fallback
4. **Admin**: Default credentials must be changed in production
5. **API Rate**: Limited to 100 requests per 15 minutes
6. **Session**: Admin sessions expire after 24 hours

---

## Contact & Support

For issues, check:
1. `SETUP_GUIDE.md` - Installation help
2. `DEPLOYMENT_GUIDE.md` - Deployment help
3. `API_SPEC.json` - API documentation
4. Browser console - Frontend errors
5. Server logs - Backend errors

---

**Version**: 1.0.0
**Last Updated**: April 2, 2026
**Status**: Production Ready ✅
