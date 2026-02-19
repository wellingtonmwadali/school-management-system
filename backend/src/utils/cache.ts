import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import NodeCache from 'node-cache';

// In-memory cache fallback
const memoryCache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false,
});

// Redis client (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  redisClient.on('error', (err: any) => {
    console.error('Redis Client Error:', err);
    redisClient = null; // Fallback to memory cache
  });
  
  redisClient.connect().catch(() => {
    console.log('Failed to connect to Redis, using memory cache');
    redisClient = null;
  });
}

// Cache middleware
export const cache = (duration: number = 600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      // Try Redis first
      if (redisClient && redisClient.isOpen) {
        const cached = await redisClient.get(key);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(key);
        if (cached) {
          return res.json(cached);
        }
      }
      
      // Store the original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json
      res.json = (data: any) => {
        // Cache the response
        if (res.statusCode === 200) {
          if (redisClient && redisClient.isOpen) {
            redisClient.setEx(key, duration, JSON.stringify(data)).catch(console.error);
          } else {
            memoryCache.set(key, data, duration);
          }
        }
        
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Cache invalidation
export const invalidateCache = async (pattern: string) => {
  try {
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      // For memory cache, we need to match pattern manually
      const keys = memoryCache.keys();
      const regex = new RegExp(pattern.replace('*', '.*'));
      keys.forEach((key: string) => {
        if (regex.test(key)) {
          memoryCache.del(key);
        }
      });
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Clear all cache
export const clearAllCache = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.flushDb();
    } else {
      memoryCache.flushAll();
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

// Cache stats
export const getCacheStats = () => {
  if (!redisClient) {
    return memoryCache.getStats();
  }
  return { provider: 'redis' };
};

// Specific cache utilities
export const cacheHelper = {
  // Cache for 5 minutes
  short: cache(300),
  
  // Cache for 10 minutes
  medium: cache(600),
  
  // Cache for 30 minutes
  long: cache(1800),
  
  // Cache for 1 hour
  veryLong: cache(3600),
  
  // Invalidate patterns
  invalidateStudents: () => invalidateCache('cache:*/students*'),
  invalidateStudent: (id: string) => invalidateCache(`cache:*/students/${id}*`),
  invalidateAttendance: () => invalidateCache('cache:*/attendance*'),
  invalidateFees: () => invalidateCache('cache:*/fees*'),
  invalidateExams: () => invalidateCache('cache:*/exams*'),
  invalidateAll: clearAllCache,
};

// Response compression check
export const shouldCompress = (req: Request, res: Response) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return true;
};
