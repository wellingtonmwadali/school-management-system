# School ERP System - Production Deployment Guide

## 🚀 Production-Ready Features

This School ERP system is built to handle **1,000-10,000 transactions per day** with the following enterprise features:

### 🛡️ Security
- **Helmet** - Security headers (CSP, HSTS, XSS protection)
- **CORS** - Configurable origin whitelist
- **Rate Limiting** - Multiple rate limiters for different endpoints
- **Input Validation** - Express-validator on all inputs
- **NoSQL Injection Prevention** - Sanitization of MongoDB queries
- **HPP** - HTTP Parameter Pollution prevention
- **Request Size Limiting** - Prevent payload attacks

### 📊 Performance
- **Redis Caching** - With memory fallback for GET requests
- **Response Compression** - Gzip compression
- **Database Indexes** - Optimized queries on all models
- **Connection Pooling** - MongoDB connection optimization

### 🔍 Monitoring & Logging
- **Winston Logger** - Structured JSON logging with file rotation
- **Health Checks** - /health, /ready, /alive endpoints
- **Metrics** - /metrics endpoint for monitoring
- **Request Tracking** - Unique request IDs

### ⚡ Scalability
- **Cluster Mode** - PM2 with max instances
- **Stateless Design** - Horizontal scaling ready
- **Graceful Shutdown** - Clean process termination

## 📦 Prerequisites

- Node.js 18+ or 20+
- MongoDB 5.0+ (MongoDB Atlas recommended)
- Redis 6.0+ (optional but recommended)
- PM2 (for production)

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Critical Environment Variables:**

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/school-erp
JWT_SECRET=<generate-strong-secret>
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_REQUEST_SIZE=10mb
LOG_LEVEL=info
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Database Setup

Ensure MongoDB is running and create indexes:

```bash
npm run seed  # Optional: seed initial data
```

## 🚀 Deployment Options

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application in cluster mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status                  # Check status
pm2 logs school-erp-api    # View logs
pm2 monit                  # Monitor resources
pm2 restart school-erp-api # Restart
pm2 reload school-erp-api  # Zero-downtime reload
pm2 stop school-erp-api    # Stop
```

### Option 2: Docker

```bash
# Build image
docker build -t school-erp-backend .

# Run container
docker run -d \
  --name school-erp-api \
  -p 5000:5000 \
  --env-file .env \
  school-erp-backend
```

### Option 3: Docker Compose

```bash
docker-compose up -d
```

## 📊 Performance Optimization

### Rate Limits (per endpoint)
- **General API**: 100 requests / 15 minutes
- **Authentication**: 5 requests / 15 minutes
- **Payments**: 50 requests / hour
- **File Uploads**: 20 requests / hour
- **Data Exports**: 10 requests / hour

### Caching Strategy
- **Short cache** (5 min): Real-time data (dashboards, attendance summary)
- **Medium cache** (10 min): Frequently accessed data (students list, invoices)
- **Long cache** (30 min): Stable data (exam results, student profiles)
- **Very long cache** (1 hour): Static data (configurations, books)

### Database Indexes

All models have optimized indexes:
- **Students**: schoolId + admissionNumber (unique), schoolId + class + stream
- **Attendance**: schoolId + date + studentId (unique), date + class + stream
- **Fees**: schoolId + invoiceNumber (unique), studentId + academicYear + term
- **Exams**: schoolId + academicYear + term, examId + subject
- **Users**: email (unique), schoolId + role, schoolId + isActive

## 🔍 Monitoring

### Health Check Endpoints

- **`GET /health`** - Full health check with database connectivity
- **`GET /ready`** - Kubernetes readiness probe
- **`GET /alive`** - Kubernetes liveness probe
- **`GET /metrics`** - System metrics (memory, CPU, uptime)

### Logging

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Files rotate at 5MB, keeping 5 files

Log levels: `error`, `warn`, `info`, `debug`

## 🛡️ Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Enable HTTPS (use nginx/caddy reverse proxy)
- [ ] Set up Redis for distributed rate limiting
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Enable MongoDB authentication
- [ ] Set up regular database backups
- [ ] Configure API keys for third-party access
- [ ] Review and update security headers in `middleware/security.ts`
- [ ] Enable 2FA for admin accounts
- [ ] Set up monitoring alerts (Sentry, DataDog, etc.)

## 🔒 Production Best Practices

### 1. Use HTTPS
Set up SSL/TLS with Let's Encrypt or your certificate provider.

### 2. Reverse Proxy
Use Nginx or Caddy:

```nginx
server {
    listen 80;
    server_name api.yourschool.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Database Backups

```bash
# Daily backup script
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
```

### 4. Redis Setup

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
```

### 5. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📈 Scaling Guide

### Vertical Scaling
- Increase server RAM (2GB minimum, 4GB+ recommended)
- Use faster CPUs
- Increase MongoDB connection pool

### Horizontal Scaling
- Deploy multiple backend instances
- Use PM2 cluster mode (already configured)
- Set up load balancer (Nginx, HAProxy, AWS ALB)
- Use Redis for shared sessions and caching
- Configure MongoDB replica set

### Load Balancer Example (Nginx)

```nginx
upstream backend {
    least_conn;
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
    server localhost:5004;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

## 🐛 Troubleshooting

### High Memory Usage
```bash
# Check PM2 processes
pm2 monit

# Restart with memory limit
pm2 restart ecosystem.config.js --update-env
```

### Database Connection Issues
- Check MongoDB URI
- Verify network access (whitelist IP in MongoDB Atlas)
- Check connection pool settings

### Redis Connection Failed
- System will fallback to memory cache
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL environment variable

### Rate Limit Errors
- Adjust limits in `middleware/rateLimiter.ts`
- Check if Redis is connected for distributed limiting

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs school-erp-api`
- Health check: `curl http://localhost:5000/health`
- Metrics: `curl http://localhost:5000/metrics`

## 📜 License

Proprietary - All rights reserved
