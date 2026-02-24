import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Security headers using Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
});

// CORS configuration
export const corsOptions = cors({
  origin: (origin, callback) => {
    console.log('🔒 ============================================');
    console.log('🔒 CORS CHECK');
    console.log('🔒 ============================================');
    console.log('🌍 Request Origin:', origin || 'No origin (same-origin or tool)');
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3010',
      'http://localhost:3000',
    ];
    
    console.log('✅ Allowed Origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Request allowed');
      console.log('🔒 ============================================');
      callback(null, true);
    } else {
      console.log('❌ CORS: Request BLOCKED - Origin not in allowed list');
      console.log('🔒 ============================================');
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// NoSQL Injection prevention
export const preventNoSQLInjection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: any) => {
    console.warn(`Sanitized potential NoSQL injection in ${key}`);
  },
});

// HTTP Parameter Pollution prevention
export const preventParameterPollution = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'class',
    'stream',
    'status',
    'term',
    'academicYear',
    'gender'
  ],
});

// Request size limiter
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '10mb');
  
  if (req.headers['content-length']) {
    const size = parseInt(req.headers['content-length']);
    const maxBytes = maxSize * 1024 * 1024; // Convert to bytes
    
    if (size > maxBytes) {
      return next(new AppError('Request entity too large', 413));
    }
  }
  
  next();
};

// API versioning middleware
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.apiVersion = version;
    next();
  };
};

// Request ID middleware for tracking
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// IP whitelist (optional, for admin routes)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return next(new AppError('Access denied from this IP', 403));
    }
    
    next();
  };
};

// API key authentication (for third-party integrations)
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return next(new AppError('Invalid or missing API key', 401));
  }
  
  next();
};

// Content-Type validation
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return next(new AppError('Content-Type must be application/json', 415));
    }
  }
  
  next();
};

// Timing attack prevention for sensitive operations
export const preventTimingAttacks = async (
  fn: Function,
  minDelay: number = 1000
) => {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  
  if (elapsed < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
  }
  
  return result;
};

// Add security-related custom types
declare global {
  namespace Express {
    interface Request {
      id?: string;
      apiVersion?: string;
    }
  }
}
