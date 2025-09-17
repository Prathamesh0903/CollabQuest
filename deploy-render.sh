#!/bin/bash

# Render Deployment Script for Collaborative Coding Platform
# This script helps you deploy your project to Render

echo "🚀 Starting Render Deployment Process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "❌ Git remote origin not set. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    exit 1
fi

echo "✅ Git repository is ready"

# Check for required files
echo "🔍 Checking for required configuration files..."

required_files=("render.yaml" "server/package.json" "client/package.json")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Check environment variables
echo "🔍 Checking environment variables..."

# Create .env.production file for server
cat > server/.env.production << EOF
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
CLIENT_URL=https://your-frontend.onrender.com
DOCKER_ENABLED=false
EOF

# Create .env.production file for client
cat > client/.env.production << EOF
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
EOF

echo "✅ Environment files created (please update with your actual values)"

# Push to GitHub
echo "📤 Pushing code to GitHub..."
git add .
git commit -m "Prepare for Render deployment" || echo "No changes to commit"
git push origin main || git push origin master

echo "✅ Code pushed to GitHub"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect render.yaml and create services"
echo "5. Update environment variables in Render dashboard with your actual values:"
echo "   - MongoDB Atlas connection string"
echo "   - Firebase credentials"
echo "   - JWT secret"
echo "6. Update CLIENT_URL and REACT_APP_API_URL with your actual Render URLs"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
