# RuralConnect Deployment Guide

This guide covers different deployment options for the RuralConnect government schemes chatbot.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key
- Google Translate API key (optional)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ruralconnect
```

### 2. Environment Configuration
```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# Edit backend/.env with your API keys
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
```

### 3. Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🌐 Production Deployment

### Option 1: Cloud Platforms

#### Vercel (Frontend) + Railway (Backend)
```bash
# Frontend deployment
cd frontend
npm run build
# Deploy to Vercel

# Backend deployment
cd backend
# Deploy to Railway with environment variables
```

#### Netlify (Frontend) + Render (Backend)
```bash
# Frontend deployment
cd frontend
npm run build
# Deploy to Netlify

# Backend deployment
cd backend
# Deploy to Render with environment variables
```

### Option 2: VPS/Server Deployment

#### Using PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "ruralconnect-backend"

# Start frontend (if serving from server)
cd frontend
npm run build
pm2 serve dist 3000 --name "ruralconnect-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/ruralconnect
sudo ln -s /etc/nginx/sites-available/ruralconnect /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Kubernetes Deployment

#### Create Kubernetes Manifests
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ruralconnect

---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ruralconnect
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ruralconnect/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: openai-key
        - name: REDIS_URL
          value: "redis://redis:6379"
---
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ruralconnect
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ruralconnect/frontend:latest
        ports:
        - containerPort: 80
```

#### Deploy to Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ruralconnect
kubectl get services -n ruralconnect
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=production

# Optional
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
REDIS_URL=redis://localhost:6379
CHROMA_HOST=localhost
CHROMA_PORT=8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```env
# Required
VITE_API_URL=https://your-backend-domain.com/api

# Optional
VITE_APP_NAME=RuralConnect
VITE_APP_VERSION=1.0.0
VITE_ENABLE_VOICE=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_ANALYTICS=false
```

## 📊 Monitoring and Logging

### Health Checks
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000/
```

### Log Monitoring
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2 logs
pm2 logs ruralconnect-backend
pm2 logs ruralconnect-frontend
```

### Performance Monitoring
- Use tools like New Relic, DataDog, or Prometheus
- Monitor API response times
- Track user engagement metrics
- Monitor vector database performance

## 🔒 Security Considerations

### SSL/TLS Configuration
```bash
# Generate SSL certificates (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Or use self-signed certificates for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Security Headers
The application includes security headers in the Nginx configuration:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### API Rate Limiting
- Chat API: 5 requests per second
- General API: 10 requests per second
- Configurable in nginx.conf

## 🚀 Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple backend instances
- Implement Redis clustering for session management
- Use CDN for static assets

### Database Scaling
- Consider using managed ChromaDB or Pinecone for production
- Implement database connection pooling
- Use read replicas for better performance

### Caching Strategy
- Redis for API response caching
- Browser caching for static assets
- Service worker caching for offline support

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy RuralConnect

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy Backend
      run: |
        cd backend
        docker build -t ruralconnect/backend .
        docker push ruralconnect/backend
    
    - name: Deploy Frontend
      run: |
        cd frontend
        docker build -t ruralconnect/frontend .
        docker push ruralconnect/frontend
    
    - name: Deploy to Production
      run: |
        # Deploy to your production environment
        kubectl apply -f k8s/
```

## 📱 PWA Deployment

### Service Worker Updates
The PWA automatically handles updates through service workers. Users will be notified when new versions are available.

### Offline Support
- Cached responses for previously accessed schemes
- Offline fallback pages
- Background sync for form submissions

## 🆘 Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Verify environment variables
   docker-compose exec backend env
   ```

2. **Frontend build failures**
   ```bash
   # Clear node_modules and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Database connection issues**
   ```bash
   # Check ChromaDB status
   docker-compose exec chroma curl http://localhost:8000/api/v1/heartbeat
   
   # Check Redis connection
   docker-compose exec redis redis-cli ping
   ```

### Performance Optimization
- Enable gzip compression
- Optimize images and assets
- Use CDN for static content
- Implement database indexing
- Monitor and optimize API response times

## 📞 Support

For deployment issues or questions:
- Check the logs first
- Review the troubleshooting section
- Open an issue in the repository
- Contact the development team

---

**Note**: Always test deployments in a staging environment before deploying to production.
