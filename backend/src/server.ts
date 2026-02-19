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

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
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

export default app;
