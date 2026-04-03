require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import services
const { connectMongoDB, isMongoDBConnected } = require('./services/mongodb');
const { getRagPipeline } = require('./services/ragPipeline');
const { initializeEmbeddings } = require('./services/vectorDB');
const { ingestSchemes } = require('./services/dataIngestion');

// Import middleware
const { errorHandler, corsErrorHandler } = require('./middleware/errorHandler');

// Import routes
const chatRoutes = require('./routes/chat');
const schemesRoutes = require('./routes/schemes');
const { router: adminRoutes, verifyAdminSession } = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ============ Security Middleware ============
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use(limiter);

// ============ Body Parser ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============ Logging ============
app.use(morgan('combined'));

// ============ Routes ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    mongoDBConnected: isMongoDBConnected(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/admin', adminRoutes);

// Data ingestion endpoint (admin only)
app.post('/api/ingest-data', verifyAdminSession, async (req, res, next) => {
  try {
    const datasetPath = process.env.DATASET_PATH || 'Datasets/updated_data.csv';
    const result = await ingestSchemes(datasetPath);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res, next) => {
  try {
    const { getVectorDB } = require('./services/vectorDB');
    const vectorDB = getVectorDB();

    res.json({
      success: true,
      data: {
        serviceName: 'RuralConnect RAG Chatbot',
        version: '1.0.0',
        timestamp: new Date(),
        services: {
          mongodb: {
            status: isMongoDBConnected() ? 'connected' : 'disconnected'
          },
          vectorDB: vectorDB.getStats()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path
  });
});

// ============ Error Handler ============
app.use(corsErrorHandler);
app.use(errorHandler);

// ============ Initialization & Server Start ============
const startServer = async () => {
  try {
    console.log('\n🚀 Starting RuralConnect Backend...\n');

    // 1. Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (err) {
      console.warn('⚠️  MongoDB connection failed, will use file-based storage');
    }

    // 2. Initialize embeddings
    await initializeEmbeddings();

    // 3. Initialize RAG Pipeline
    const ragPipeline = await getRagPipeline();
    console.log('✓ RAG Pipeline ready');

    // 4. Start Express server immediately
    const server = app.listen(PORT, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`\n📍 API running on: http://localhost:${PORT}`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
      console.log(`📚 Schemes endpoint: GET http://localhost:${PORT}/api/schemes`);
      console.log(`🏥 Health check: GET http://localhost:${PORT}/health`);
      console.log(`📊 Stats: GET http://localhost:${PORT}/api/stats\n`);
    });

    // 5. Optional dataset ingestion on startup (disabled by default)
    if (process.env.REINGEST_ON_START === 'true') {
      setImmediate(async () => {
      try {
        const datasetPath = process.env.DATASET_PATH || path.join(__dirname, '..', 'Datasets', 'updated_data.csv');
        const fs = require('fs');

        if (fs.existsSync(datasetPath)) {
          console.log('\n📊 Loading initial dataset in background...');
          const result = await ingestSchemes(datasetPath);

          if (result.success) {
            console.log(`✓ Loaded ${result.schemsCount} schemes`);
          } else {
            console.warn('⚠️  Could not load dataset:', result.error);
          }
        } else {
          console.log(`⚠️  Dataset not found at ${datasetPath}`);
        }
      } catch (err) {
        console.warn('⚠️  Could not load initial dataset:', err.message);
      }
      });
    } else {
      console.log('ℹ️  Startup dataset ingestion skipped (set REINGEST_ON_START=true to enable)');
    }

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
