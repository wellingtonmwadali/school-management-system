import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Redis client for rate limiting (optional - falls back to memory)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.connect().catch(console.error);
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore - RedisStore types issue
      client: redisClient,
      prefix: 'rate_limit:',
    }),
  }),
});

// Strict limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🚫 ============================================');
    console.log('🚫 RATE LIMIT EXCEEDED');
    console.log('🚫 ============================================');
    console.log('🚫 IP:', req.ip);
    console.log('🚫 Path:', req.path);
    console.log('🚫 Message: Too many login attempts');
    console.log('🚫 ============================================');
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes.',
    });
  },
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rate_limit:auth:',
    }),
  }),
});

// Payment routes limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit payment operations
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rate_limit:payment:',
    }),
  }),
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit file uploads
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Export limiter (for data exports)
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit exports per hour
  message: 'Too many export requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
