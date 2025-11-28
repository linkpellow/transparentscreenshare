#!/bin/bash
# Build all components for deployment

set -e

echo "🔨 Building Usha Screen Sharing Application..."

# Build shared package
echo "📦 Building shared package..."
cd shared
npm install
npm run build
cd ..

# Build viewer
echo "🌐 Building viewer application..."
cd viewer
npm install
npm run build
cd ..

# Build server
echo "🖥️  Building server..."
cd server
npm install
npm run build
cd ..

# Build extension
echo "🔌 Building extension..."
cd extension
npm install
npm run build
cd ..

echo "✅ All builds complete!"
echo ""
echo "Next steps:"
echo "1. Deploy server/dist and viewer/dist to your server"
echo "2. Set up SSL certificate"
echo "3. Configure Nginx/reverse proxy"
echo "4. Start the server"

