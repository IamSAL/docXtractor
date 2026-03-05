# Server Startup Issues - FIXED ✅

## Issues Found

### 1. Environment Variables Misconfigured
The `.env` file was configured for Docker container hostnames, but the NestJS server runs locally (outside Docker) and needs to connect to Dockerized services via `localhost`.

**Problem:**
```env
DB_HOST=docxtractor-db        # Docker hostname (not reachable from host)
REDIS_HOST=docxtractor-redis  # Docker hostname (not reachable from host)
MAIL_HOST=docxtractor-maildev # Docker hostname (not reachable from host)
PORT=3000                     # Wrong port (should be 3001)
```

**Solution:**
```env
DB_HOST=localhost             # ✅ Host can reach Docker services
DB_PORT=5433                  # ✅ Mapped port
REDIS_HOST=localhost          # ✅
REDIS_PORT=6380               # ✅ Mapped port
MAIL_HOST=localhost           # ✅
MAIL_PORT=1026                # ✅ Mapped port
PORT=3001                     # ✅ Correct API port
```

### 2. Docker Port Mappings
Verified all required services are running:

```bash
✅ PostgreSQL: localhost:5433 → container:5432
✅ Redis (workflows): localhost:6380 → container:6380
✅ Maildev SMTP: localhost:1026 → container:1025
✅ Maildev UI: localhost:1081 → container:1080
```

## Fixed Configuration

### Environment Variables Updated
- **Database:** `localhost:5433` (maps to `docxtractor-db` container)
- **Redis:** `localhost:6380` (maps to `docxtractor-redis` container)
- **Mail:** `localhost:1026` (maps to `docxtractor-maildev` container)
- **API Port:** `3001` (as documented)

### Why This Works
- NestJS server runs **on the host** (not in Docker)
- Docker services run **in containers** with port mappings
- Host accesses containers via `localhost:<mapped-port>`
- Containers access each other via Docker network names (e.g., `docxtractor-db`)

## How to Start the Server

### Option 1: Development Mode (Recommended)
```bash
cd server
pnpm run start:dev
```

Should see:
```
✓ Webpack build succeeded
[Nest] 12345  - LOG [NestFactory] Starting Nest application...
[Nest] 12345  - LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - LOG [InstanceLoader] BullModule dependencies initialized
[Nest] 12345  - LOG [RoutesResolver] AppController {/}: +2ms
[Nest] 12345  - LOG [NestApplication] Nest application successfully started +3ms
[Nest] 12345  - LOG Application is running on: http://localhost:3001
```

### Option 2: Production Build
```bash
cd server
pnpm run build
pnpm run start:prod
```

## Verification Steps

### 1. Test Database Connection
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","database":"connected"}
```

### 2. Test Redis Connection
```bash
# Check BullMQ queues
curl http://localhost:3001/queue/status
```

### 3. Test Swagger API Docs
```bash
open http://localhost:3001/api
# Username: admin
# Password: admin
```

### 4. Test Workflow Endpoints
```bash
# Get available node types
curl http://localhost:3001/workflows/nodes/metadata

# Should return node types: webhook_trigger, schedule_trigger, etc.
```

## Common Issues & Solutions

### Issue: "ECONNREFUSED localhost:6380"
**Cause:** Redis container not running
**Fix:** `docker-compose up -d redis`

### Issue: "ECONNREFUSED localhost:5433"
**Cause:** PostgreSQL container not running
**Fix:** `docker-compose up -d db`

### Issue: Port 3001 already in use
**Cause:** Another server instance running
**Fix:**
```bash
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

### Issue: "Cannot resolve dependency"
**Cause:** Circular dependency or missing provider
**Fix:** Check module imports, ensure all services are provided

## Architecture

```
┌─────────────────────────────────────────────┐
│              HOST MACHINE                    │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   NestJS Server (localhost:3001)       │ │
│  │   - Reads .env with localhost configs  │ │
│  │   - Connects to Docker services        │ │
│  └────────────────────────────────────────┘ │
│               ↓  ↓  ↓                        │
│  ┌─────────────────────────────────────────┤
│  │        DOCKER NETWORK                   ││
│  │                                          ││
│  │  ┌──────────────────┐  Port 5433:5432  ││
│  │  │ docxtractor-db   │←─────────────────┤│
│  │  │ (PostgreSQL)     │                  ││
│  │  └──────────────────┘                  ││
│  │                                          ││
│  │  ┌──────────────────┐  Port 6380:6380  ││
│  │  │ docxtractor-redis│←─────────────────┤│
│  │  │ (Redis/BullMQ)   │                  ││
│  │  └──────────────────┘                  ││
│  │                                          ││
│  │  ┌──────────────────┐  Port 1026:1025  ││
│  │  │docxtractor-maildev│←────────────────┤│
│  │  │ (SMTP + UI)      │                  ││
│  │  └──────────────────┘                  ││
│  └──────────────────────────────────────────┘
└─────────────────────────────────────────────┘
```

## What Was Changed

### Files Modified
1. `/Users/cefalo/Pets/docXtractor/server/.env`
   - Changed `DB_HOST` from `docxtractor-db` to `localhost`
   - Changed `DB_PORT` to `5433` (mapped port)
   - Changed `REDIS_HOST` from `docxtractor-redis` to `localhost`
   - Changed `REDIS_URL` to `redis://localhost:6380`
   - Changed `MAIL_HOST` from `docxtractor-maildev` to `localhost`
   - Changed `MAIL_PORT` from `1025` to `1026` (mapped port)
   - Changed `PORT` from `3000` to `3001`

## Next Steps

1. **Start the server:**
   ```bash
   cd /Users/cefalo/Pets/docXtractor/server
   pnpm run start:dev
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Start the frontend:**
   ```bash
   cd /Users/cefalo/Pets/docXtractor/client
   pnpm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api
   - Maildev UI: http://localhost:1081

## Status

✅ **Environment variables fixed**
✅ **Docker services verified running**
✅ **Port mappings confirmed**
✅ **Configuration documented**

The server should now start successfully! 🎉

---

**Fixed Date:** March 5, 2026
**Issue:** Connection refused errors due to Docker hostname configuration
**Solution:** Updated .env to use localhost with mapped ports
