#!/bin/bash

# Vercel Deployment Script for Collaborative Coding Platform Frontend
# This script helps you deploy your frontend to Vercel

echo "⚡ Starting Vercel Deployment Process..."

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the client directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready"

# Check for required files
echo "🔍 Checking for required configuration files..."

required_files=("package.json" "vercel.json")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Create production environment file
cat > .env.production << EOF
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
EOF

echo "✅ Environment file created (please update with your actual values)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Vercel deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in Vercel dashboard:"
echo "   - Go to your project settings in Vercel"
echo "   - Add REACT_APP_API_URL and REACT_APP_SOCKET_URL"
echo "2. Update your backend CORS settings to include your Vercel domain"
echo "3. Test your deployed application"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
