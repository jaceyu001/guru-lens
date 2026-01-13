# Deployment Guide

This guide covers deploying Guru Lens to various platforms.

## Table of Contents

1. [Railway (Recommended)](#railway-recommended)
2. [Render](#render)
3. [Vercel (Frontend Only)](#vercel-frontend-only)
4. [AWS](#aws)
5. [Docker](#docker)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Monitoring](#monitoring)

---

## Railway (Recommended)

Railway is the easiest way to deploy Guru Lens with automatic deployments from GitHub.

### Prerequisites
- GitHub account with guru-lens repository
- Railway account (https://railway.app)

### Step 1: Connect GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select `jaceyu001/guru-lens` repository
6. Click "Deploy"

Railway will automatically detect the Node.js project and start building.

### Step 2: Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click on the service (should be named `guru-lens`)
3. Go to "Variables" tab
4. Add all required environment variables:

```env
# Database
DATABASE_URL=file:./data/dev.db

# OAuth (Manus)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# API Keys
JWT_SECRET=your_jwt_secret_key_here
POLYGON_API_KEY=your_polygon_key
FMP_API_KEY=your_fmp_key

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id

# App Settings
NODE_ENV=production
```

### Step 3: Configure Build and Start Commands

1. Go to "Settings" tab
2. Under "Build", set:
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`

### Step 4: Add Database Volume (Optional)

For persistent database storage:

1. Go to "Data" tab
2. Click "Add Volume"
3. Mount path: `/app/data`
4. This ensures your database persists across deployments

### Step 5: Configure Domain

1. Go to "Settings" → "Domains"
2. Railway provides a default domain (e.g., `guru-lens-production.up.railway.app`)
3. To use custom domain:
   - Add your domain
   - Update DNS records as instructed
   - Railway handles SSL automatically

### Step 6: Deploy

1. Click "Deploy" button
2. Railway builds and deploys automatically
3. View logs in real-time
4. Once deployed, your app is live!

### Automatic Deployments

Every time you push to GitHub:
1. Railway detects the change
2. Automatically builds the new version
3. Runs tests (if configured)
4. Deploys to production
5. Zero downtime deployment

### Monitoring

In Railway dashboard:
- View real-time logs
- Monitor CPU and memory usage
- Check deployment history
- View error logs

---

## Render

Render is another excellent option with free tier support.

### Prerequisites
- GitHub account with guru-lens repository
- Render account (https://render.com)

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Select "Deploy an existing repository"
4. Authorize Render to access GitHub
5. Select `jaceyu001/guru-lens`
6. Click "Connect"

### Step 2: Configure Service

Fill in the configuration:

- **Name**: `guru-lens`
- **Environment**: `Node`
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm run start`
- **Instance Type**: `Standard` (recommended for production)

### Step 3: Add Environment Variables

1. Scroll to "Environment Variables"
2. Add all required variables (see [Environment Variables](#environment-variables))

### Step 4: Create Service

1. Click "Create Web Service"
2. Render builds and deploys
3. View deployment logs in real-time

### Step 5: Configure Domain

1. Go to service settings
2. Under "Custom Domain", add your domain
3. Update DNS records as instructed
4. Render handles SSL automatically

### Automatic Deployments

Enable auto-deploy in settings:
- Automatic deployments on GitHub push
- Can be toggled on/off
- View deployment history

---

## Vercel (Frontend Only)

For frontend-only deployment (requires separate backend hosting).

### Prerequisites
- GitHub account
- Vercel account (https://vercel.com)

### Step 1: Export Frontend

```bash
# Build frontend only
cd client
pnpm run build
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import `jaceyu001/guru-lens` repository
4. Select "Next.js" framework
5. Configure project settings
6. Click "Deploy"

### Step 3: Configure Backend URL

1. Go to project settings
2. Add environment variable:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```
3. Redeploy

### Note

Frontend-only deployment requires:
- Separate backend hosting (Railway/Render/AWS)
- Backend API accessible from frontend
- CORS configured on backend

---

## AWS

For enterprise deployments with full control.

### Option 1: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-22 guru-lens

# Create environment
eb create guru-lens-prod

# Deploy
eb deploy

# Open application
eb open
```

### Option 2: AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install pnpm
npm install -g pnpm

# 5. Clone repository
git clone https://github.com/jaceyu001/guru-lens.git
cd guru-lens

# 6. Install dependencies
pnpm install

# 7. Set environment variables
nano .env.production

# 8. Build
pnpm run build

# 9. Start with PM2
npm install -g pm2
pm2 start "pnpm run start" --name "guru-lens"
pm2 save
pm2 startup

# 10. Configure Nginx reverse proxy
sudo apt-get install -y nginx
# Configure /etc/nginx/sites-available/guru-lens
# Point to localhost:3000
```

### Option 3: AWS Lambda + RDS

For serverless deployment:

```bash
# Install Serverless Framework
npm install -g serverless

# Initialize
serverless create --template aws-nodejs

# Deploy
serverless deploy
```

---

## Docker

For containerized deployment.

### Create Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["pnpm", "run", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  guru-lens:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/dev.db
      - VITE_APP_ID=${VITE_APP_ID}
      - JWT_SECRET=${JWT_SECRET}
      - OAUTH_SERVER_URL=https://api.manus.im
      - VITE_OAUTH_PORTAL_URL=https://portal.manus.im
      - BUILT_IN_FORGE_API_URL=https://api.manus.im
      - BUILT_IN_FORGE_API_KEY=${BUILT_IN_FORGE_API_KEY}
      - VITE_FRONTEND_FORGE_API_KEY=${VITE_FRONTEND_FORGE_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Build and Run

```bash
# Build image
docker build -t guru-lens:latest .

# Run container
docker run -p 3000:3000 \
  -e VITE_APP_ID=your_app_id \
  -e JWT_SECRET=your_secret \
  guru-lens:latest

# Or with docker-compose
docker-compose up -d
```

### Push to Docker Hub

```bash
# Tag image
docker tag guru-lens:latest jaceyu001/guru-lens:latest

# Login to Docker Hub
docker login

# Push
docker push jaceyu001/guru-lens:latest
```

---

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=file:./data/dev.db

# OAuth (Manus)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# API Keys
JWT_SECRET=your_jwt_secret_key_here
POLYGON_API_KEY=your_polygon_key
FMP_API_KEY=your_fmp_key

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

### Optional Variables

```env
# Node environment
NODE_ENV=production

# Server
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info

# Cache
CACHE_TTL=3600

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Getting API Keys

**Manus APIs:**
- Provided automatically by Manus platform
- Available in project settings

**Polygon.io:**
- Sign up at https://polygon.io
- Get API key from dashboard
- Free tier available

**Financial Modeling Prep (FMP):**
- Sign up at https://financialmodelingprep.com
- Get API key from dashboard
- Free tier available

---

## Database Setup

### SQLite (Default)

```bash
# Database is automatically created at ./data/dev.db
# Migrations run automatically on startup

# To manually run migrations:
pnpm db:push

# To view database:
pnpm db:studio
```

### PostgreSQL (Production Recommended)

```bash
# Update DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/guru_lens

# Run migrations
pnpm db:push

# Verify connection
pnpm db:studio
```

### Database Backups

```bash
# SQLite backup
cp data/dev.db data/dev.db.backup

# PostgreSQL backup
pg_dump -h host -U user guru_lens > backup.sql

# PostgreSQL restore
psql -h host -U user guru_lens < backup.sql
```

---

## Monitoring

### Railway Monitoring

- Dashboard shows real-time metrics
- CPU and memory usage
- Network I/O
- Deployment history
- Error logs

### Render Monitoring

- Service metrics dashboard
- CPU and memory usage
- Disk usage
- Network metrics
- Error logs

### Application Monitoring

Add monitoring tools:

```bash
# PM2 monitoring
pm2 monit

# Datadog integration
npm install dd-trace

# New Relic integration
npm install newrelic
```

### Health Checks

```bash
# Check application health
curl https://your-app-url.com/health

# Check database
curl https://your-app-url.com/api/health/db
```

### Log Aggregation

```bash
# View logs
tail -f logs/app.log

# Filter errors
grep ERROR logs/app.log

# Analyze logs
cat logs/app.log | jq '.level'
```

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### Database Connection Error

```bash
# Check DATABASE_URL format
# SQLite: file:./data/dev.db
# PostgreSQL: postgresql://user:password@host:5432/db

# Test connection
pnpm db:studio
```

### Port Already in Use

```bash
# Change port
PORT=3001 pnpm run start

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

### Out of Memory

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=2048 pnpm run start

# Or upgrade instance type
```

### Slow Performance

```bash
# Check database indexes
pnpm db:studio

# Enable caching
CACHE_TTL=3600

# Monitor performance
pm2 monit
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring enabled
- [ ] Error logging configured
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Backup strategy in place
- [ ] Disaster recovery plan ready

---

## Support

For deployment issues:

1. Check [Railway Docs](https://docs.railway.app)
2. Check [Render Docs](https://render.com/docs)
3. Check [GitHub Issues](https://github.com/jaceyu001/guru-lens/issues)
4. Create new issue with deployment details

---

**Happy deploying! 🚀**
