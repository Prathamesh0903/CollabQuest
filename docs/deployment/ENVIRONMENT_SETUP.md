# Environment Setup Guide

This guide explains how to properly set up environment variables for CollabQuest development and production.

## 🚨 **CRITICAL SECURITY WARNING**

**NEVER commit real secrets to version control!**

- ✅ **Safe**: `env.example` files (templates with placeholder values)
- ❌ **DANGEROUS**: `.env` files (contain real secrets)
- ❌ **DANGEROUS**: Hardcoded secrets in code

## 📁 Environment Files

### Root Level
- `env.example` - Template for root environment variables
- `.env` - Your actual environment variables (gitignored)

### Client Level
- `client/.env.example` - Template for client environment variables
- `client/.env.local` - Your actual client environment variables (gitignored)

### Server Level
- `server/env.example` - Template for server environment variables
- `server/.env` - Your actual server environment variables (gitignored)

## 🔧 Setup Instructions

### 1. Development Setup

```bash
# Copy environment templates
cp env.example .env
cp server/env.example server/.env
cp client/.env.example client/.env.local

# Edit with your actual values
nano .env
nano server/.env
nano client/.env.local
```

### 2. Production Setup

#### Render (Backend)
Set environment variables in Render dashboard:
- Go to your service → Environment
- Add each variable from `server/env.example`

#### Vercel (Frontend)
Set environment variables in Vercel dashboard:
- Go to your project → Settings → Environment Variables
- Add each variable from `client/.env.example`

## 📋 Environment Variables Reference

### Root Environment Variables

```bash
NODE_ENV=development
```

### Client Environment Variables

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Development Configuration
REACT_APP_DEBUG=false
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_BATTLE_MODE=true
REACT_APP_ENABLE_QUIZ_MODE=true
REACT_APP_ENABLE_DSA_MODE=true
```

### Server Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/collabquest
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/collabquest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_JWKS_URL=https://your-project-id.supabase.co/auth/v1/keys
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Docker Configuration
DOCKER_ENABLED=false
DOCKER_SOCKET=/var/run/docker.sock

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Code Execution Configuration
EXECUTOR_URL=http://localhost:5001
```

## 🔐 Security Best Practices

### 1. Environment File Security
- ✅ Use `.env.example` as templates
- ✅ Keep `.env` files in `.gitignore`
- ❌ Never commit real secrets
- ❌ Never hardcode secrets in code

### 2. Secret Management
- **Development**: Use local `.env` files
- **Production**: Use platform environment variables
- **CI/CD**: Use secure secret management
- **Team Sharing**: Use encrypted communication

### 3. Key Rotation
- Rotate JWT secrets regularly
- Update Supabase keys when needed
- Monitor for exposed secrets
- Use different keys for different environments

## 🚀 Quick Setup Script

Use the provided setup script for automatic environment configuration:

```bash
# Windows
setup-local-dev.bat

# macOS/Linux
./setup-local-dev.sh
```

## 🔍 Verification

### Check Environment Variables
```bash
# Check if .env files exist
ls -la .env*
ls -la server/.env*
ls -la client/.env*

# Verify no secrets in git
git status
git diff --cached
```

### Test Configuration
```bash
# Start development servers
npm run dev

# Check server health
curl http://localhost:5000/api/health

# Check client
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check file location and naming
ls -la .env*
ls -la server/.env*
ls -la client/.env*
```

#### 2. Missing Variables
```bash
# Compare with templates
diff .env env.example
diff server/.env server/env.example
diff client/.env.local client/.env.example
```

#### 3. Invalid Values
- Check Supabase project URL format
- Verify MongoDB connection string
- Ensure JWT secret is long enough
- Validate all URLs are accessible

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify environment file setup
3. Test with minimal configuration
4. Create an issue with details

---

**Remember**: Security is everyone's responsibility. Keep your secrets safe! 🔒
