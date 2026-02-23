import 'express-async-errors';
import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/database';
import routes from './routes';

// Import custom middleware
import {
  errorHandler,
  notFound,
  requestLogger,
  handleUnhandledRejection,
  handleUncaughtException,
  logger
} from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import {
  securityHeaders,
  corsOptions,
  preventNoSQLInjection,
  preventParameterPollution,
  requestId,
  validateContentType,
} from './middleware/security';
import { sanitizeBody } from './middleware/validation';
import { shouldCompress } from './utils/cache';
import { healthCheck, readinessProbe, livenessProbe, metrics } from './utils/health';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Request ID for tracking
app.use(requestId);

// Security Headers
app.use(securityHeaders);

// CORS
app.use(corsOptions);

// Compression (gzip)
app.use(compression({ filter: shouldCompress, level: 6 }));

// Body parsing with limits
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Sanitization
app.use(sanitizeBody);
app.use(preventNoSQLInjection);
app.use(preventParameterPollution);

// Content-Type validation
app.use(validateContentType);

// Request logging
app.use(requestLogger);

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
}

// Health check endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessProbe);
app.get('/alive', livenessProbe);
app.get('/metrics', metrics);

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

// Database connection state
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

// Initialize database connection
const initDatabase = async () => {
  if (dbInitialized) return;
  
  // If initialization is in progress, wait for it
  if (dbInitPromise) return dbInitPromise;
  
  dbInitPromise = (async () => {
    try {
      await connectDB();
      logger.info('Database connected successfully');
      dbInitialized = true;
    } catch (error) {
      logger.error('Database connection failed:', error);
      dbInitPromise = null; // Reset so it can be retried
      // Don't exit in serverless environments
      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }
      throw error;
    }
  })();
  
  return dbInitPromise;
};

// For non-serverless environments, connect immediately
// But don't crash if it fails - let health checks report status
if (process.env.VERCEL !== '1') {
  initDatabase().catch(err => {
    logger.error('Failed to initialize database on startup:', err);
    logger.warn('Server will continue running - retrying DB connection on next request');
    // Don't exit - allow server to start and serve health checks
    // Health endpoint will report database status
  });
}

// Middleware to ensure DB is connected in serverless
if (process.env.VERCEL === '1') {
  app.use(async (req, res, next) => {
    try {
      await initDatabase();
      next();
    } catch (error) {
      logger.error('Database initialization failed in request:', error);
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
}

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  const start = async () => {
    try {
      // Bind to 0.0.0.0 for Docker/Cloud platforms (Render, Railway, etc.)
      // This allows external connections, not just localhost
      const HOST = process.env.HOST || '0.0.0.0';
      
      // Start server
      const server = app.listen(PORT, HOST, () => {
        logger.info(`🚀 Server running on ${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
        logger.info(`🔍 Metrics: http://localhost:${PORT}/metrics`);
      });
      
      // Graceful shutdown
      const gracefulShutdown = (signal: string) => {
        logger.info(`${signal} signal received: closing HTTP server`);
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
        
        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      };
      
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  start();
}

// Export app for serverless environments (Vercel)
export default app;
