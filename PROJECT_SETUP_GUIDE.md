# Complete Project Setup Guide

## 🚀 Project Overview

This is a collaborative coding platform with real-time collaborative editing, code execution, and gamification features.

## 📋 Prerequisites

- Node.js (v18+)
- npm (v8+)
- Docker
- Git

## 🔧 Environment Setup

### 1. Root Directory Environment Variables

Create a `.env` file in the root directory with all required variables.

### 2. Server Directory Environment Variables

Create a `.env` file in the `server/` directory with server-specific variables.

## 🚀 Installation & Setup
4
### Step 1: Install Dependencies

```bash
npm run install-all
```

### Step 2: Start Services

#### Option A: Start All Services Together (Recommended)

```bash
npm run dev
```

#### Option B: Start Services Individually

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Executor Service:**
```bash
cd executor
npm start
```

**Terminal 3 - Frontend Client:**
```bash
cd client
npm start
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "Disconnected" Status in Collaborative Editor

**Solution**: 
1. Ensure all three services are running
2. Check browser console for connection errors
3. Verify environment variables are set correctly

### Issue 2: Cannot Create Files or Folders

**Solution**:
1. Ensure the backend server is running
2. Check if the `uploads` directory exists
3. Verify file permissions

### Issue 3: Code Execution Not Working

**Solution**:
1. Ensure Docker is running
2. Check if executor service is healthy
3. Verify Docker socket permissions

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Executor Service**: http://localhost:5001

## 🚀 Development Commands

```bash
# Install dependencies
npm run install-all

# Start development mode
npm run dev

# Build frontend
npm run build
```
