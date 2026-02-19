import { Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    memory: {
      used: number;
      free: number;
      total: number;
      percentage: number;
    };
    cpu: {
      cores: number;
      loadAverage: number[];
    };
  };
  errors?: string[];
}

export const healthCheck = async (req: Request, res: Response) => {
  const errors: string[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Check database connectivity
  let dbStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  let dbResponseTime: number | undefined;
  
  try {
    const start = Date.now();
    const dbState = mongoose.connection.readyState;
    
    if (dbState === 1 && mongoose.connection.db) {
      // Test query to verify connection
      await mongoose.connection.db.admin().ping();
      dbStatus = 'connected';
      dbResponseTime = Date.now() - start;
    } else {
      dbStatus = 'disconnected';
      errors.push('Database is not connected');
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    dbStatus = 'error';
    errors.push(`Database error: ${error instanceof Error ? error.message : 'Unknown'}`);
    overallStatus = 'unhealthy';
  }
  
  // Memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = (usedMemory / totalMemory) * 100;
  
  // Check memory threshold
  if (memoryPercentage > 90) {
    errors.push('High memory usage detected');
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }
  
  // CPU information
  const cpus = os.cpus();
  const loadAverage = os.loadavg();
  
  // Check CPU load
  if (loadAverage[0] > cpus.length * 0.8) {
    errors.push('High CPU load detected');
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }
  
  const health: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
      cpu: {
        cores: cpus.length,
        loadAverage: loadAverage.map(load => Math.round(load * 100) / 100),
      },
    },
  };
  
  if (errors.length > 0) {
    health.errors = errors;
  }
  
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
};

// Readiness probe (for Kubernetes/Docker)
export const readinessProbe = async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    
    if (dbState === 1) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database not connected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Liveness probe (for Kubernetes/Docker)
export const livenessProbe = (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

// Metrics endpoint
export const metrics = (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: process.cpuUsage(),
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
    },
  });
};
