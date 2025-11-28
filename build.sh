#!/bin/bash
# Build script for Railway deployment
set -e

echo "Building shared package..."
cd shared
npm install
npm run build
cd ..

echo "Building server..."
cd server
npm install
npm run build
cd ..

echo "✅ Build complete"

