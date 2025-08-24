# 🚀 Port Configuration Summary

## 📋 **All Services Port Configuration**

| Service | Port | Purpose | Status | Configuration Files |
|---------|------|---------|--------|-------------------|
| **React Frontend** | `3000` | User Interface | ⚠️ Not Running | `client/Dockerfile`, `docker-compose.yml` |
| **Node.js Backend API** | `5001` | Main API Server | ✅ Running | `server/server.js`, `server/package.json`, `docker-compose.yml` |
| **Code Execution Service** | `5002` | Docker-based Code Execution | ⚠️ Not Running | `executor/index.js`, `executor/package.json`, `docker-compose.yml` |
| **MongoDB Database** | `27017` | Database Storage | ⚠️ Not Running | `docker-compose.yml` |
| **Redis Cache** | `6379` | Session Management | ⚠️ Not Running | `docker-compose.yml` |
| **Nginx HTTP** | `80` | Reverse Proxy (HTTP) | ⚠️ Not Running | `docker-compose.yml` |
| **Nginx HTTPS** | `443` | Reverse Proxy (HTTPS) | ⚠️ Not Running | `docker-compose.yml` |

## 🔧 **Configuration Details**

### **1. React Frontend (Port 3000)**
```yaml
# docker-compose.yml
client:
  ports:
    - "3000:3000"
  environment:
    REACT_APP_API_URL: http://localhost:5001
    REACT_APP_SOCKET_URL: http://localhost:5001
```

### **2. Node.js Backend API (Port 5001)**
```javascript
// server/server.js
const PORT = process.env.PORT || 5001;

// server/package.json
"start": "cross-env PORT=5001 node server.js",
"dev": "cross-env PORT=5001 nodemon server.js"
```

```yaml
# docker-compose.yml
server:
  environment:
    PORT: 5001
  ports:
    - "5001:5001"
```

### **3. Code Execution Service (Port 5002)**
```javascript
// executor/index.js
const PORT = process.env.PORT || 5002;

// executor/package.json
"start": "cross-env PORT=5002 node index.js",
"dev": "cross-env PORT=5002 nodemon index.js"
```

```yaml
# docker-compose.yml
executor:
  environment:
    PORT: 5002
  ports:
    - "5002:5002"
```

### **4. MongoDB Database (Port 27017)**
```yaml
# docker-compose.yml
mongodb:
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password123
    MONGO_INITDB_DATABASE: collaborative_coding
```

### **5. Redis Cache (Port 6379)**
```yaml
# docker-compose.yml
redis:
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### **6. Nginx Reverse Proxy (Ports 80/443)**
```yaml
# docker-compose.yml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./client/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
```

## 🚀 **How to Start All Services**

### **Option 1: Docker Compose (Recommended)**
```bash
# Start Docker Desktop first
docker-compose up --build
```

### **Option 2: Manual Start**
```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 2. Start Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 3. Start Backend Server
cd server && npm run dev

# 4. Start Code Executor
cd executor && npm run dev

# 5. Start Frontend
cd client && npm start

# 6. Start Nginx (optional)
docker run -d -p 80:80 -p 443:443 nginx:alpine
```

## 🔍 **Health Check Endpoints**

- **Backend API**: `http://localhost:5001/api/health`
- **Code Executor**: `http://localhost:5002/health`
- **Frontend**: `http://localhost:3000`
- **MongoDB**: `mongodb://localhost:27017`
- **Redis**: `redis://localhost:6379`

## 📊 **Service Dependencies**

```
Client (3000) → Server (5001) → Executor (5002)
                ↓
            MongoDB (27017)
                ↓
            Redis (6379)
                ↓
            Nginx (80/443)
```

## ⚠️ **Current Status**

- ✅ **Backend API (5001)**: Running
- ⚠️ **All Other Services**: Not Running (Docker Desktop required)

## 🔧 **Troubleshooting**

### **Docker Desktop Issues**
```bash
# Check if Docker is running
docker ps

# Start Docker Desktop if not running
# Then run:
docker-compose up --build
```

### **Port Conflicts**
```bash
# Check what's using each port
netstat -ano | findstr :3000
netstat -ano | findstr :5001
netstat -ano | findstr :5002
netstat -ano | findstr :27017
netstat -ano | findstr :6379
netstat -ano | findstr :80
netstat -ano | findstr :443
```

### **Missing Dependencies**
```bash
# Install dependencies in each directory
cd server && npm install
cd executor && npm install
cd client && npm install
```
