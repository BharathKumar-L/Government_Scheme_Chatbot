# RuralConnect - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (optional - system will use fallback)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

### Configuration

**Backend** (`backend/.env`):
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

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## Production Deployment

### Docker Deployment

Create `Dockerfile` for backend:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend .
COPY Datasets ../Datasets

EXPOSE 3001

CMD ["node", "server.js"]
```

Create `Dockerfile` for frontend:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Docker Compose (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/ruralconnect
      FRONTEND_URL: https://yourdomain.com
    depends_on:
      - mongo
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: always

  mongo:
    image: mongo:latest
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    restart: always

volumes:
  mongo_data:
```

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## Cloud Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
```bash
# Connect to instance
ssh -i key.pem ubuntu@your-instance-ip

# Install dependencies
sudo apt update
sudo apt install nodejs npm mongodb-org

# Clone repository
git clone your-repo-url
cd ruralconnect

# Install and start
cd backend && npm install && npm start
```

2. **Use Process Manager**
```bash
# Install PM2
npm install -g pm2

# Run backend
pm2 start server.js --name "ruralconnect-api"

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

3. **Setup Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Heroku Deployment

1. **Create Procfile**
```
web: cd backend && npm start
```

2. **Deploy**
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongo-uri
```

### Railway/Render Deployment

Both platforms support Node.js directly:

1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy - platform handles npm install and start scripts

## MongoDB Setup

### Local Installation

```bash
# On MacOS
brew install mongodb-community
brew services start mongodb-community

# On Ubuntu
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# On Windows
# Download from mongodb.com
```

### MongoDB Atlas (Cloud)

1. Create account at mongodb.com/cloud
2. Create cluster
3. Get connection string
4. Set in `.env`:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ruralconnect
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
```

### Update Nginx

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    # ... rest of config
}
```

## Monitoring & Maintenance

### Check Service Health

```bash
# API health
curl http://localhost:3001/health

# System stats
curl http://localhost:3001/api/stats
```

### Database Backups

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/ruralconnect" --out=./backup

# Restore
mongorestore ./backup
```

### Log Monitoring

```bash
# View PM2 logs
pm2 logs ruralconnect-api

# View Nginx logs
tail -f /var/log/nginx/error.log
```

## Security Checklist

- [ ] Change default admin credentials
- [ ] Enable HTTPS/SSL
- [ ] Set strong MongoDB passwords
- [ ] Configure firewall rules
- [ ] Use environment secrets (not .env in production)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup monitoring/alerts
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Use strong session tokens

## Performance Optimization

### Caching Strategy

```javascript
// In backend services
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Cache embeddings
if (cache.has(key)) {
  return cache.get(key);
}
```

### Database Indexing

```javascript
// Mongoose schema
schemeSchema.index({ name: 'text', category: 1, level: 1 });
```

### Load Balancing

Use Nginx upstream:

```nginx
upstream api_servers {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location /api {
        proxy_pass http://api_servers;
    }
}
```

## Troubleshooting

### Backend won't start
```bash
# Check port 3001 is free
lsof -i :3001
# Kill if needed
kill -9 <PID>
```

### MongoDB connection fails
```bash
# Check MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Or restart
sudo systemctl restart mongod
```

### Slow response times
- Use `npm start` (production build)
- Check database indexes
- Monitor CPU/memory usage
- Enable caching

### Voice input not working
- Ensure HTTPS in production
- Check microphone permissions
- Test in supported browser (Chrome, Firefox, Edge)

## Support & Monitoring

### Set up Monitoring
- Use New Relic, Datadog, or CloudFare
- Monitor response times, errors, CPU, memory
- Setup alerts for critical issues

### Logging Service
```javascript
// Configure Winston or Pino for logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

**Version**: 1.0.0
**Last Updated**: 2024-04-02
