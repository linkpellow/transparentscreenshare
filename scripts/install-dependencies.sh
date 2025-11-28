#!/bin/bash
# Install all dependencies for development

set -e

echo "📦 Installing all dependencies..."

# Root
echo "Installing root dependencies..."
npm install

# Shared
echo "Installing shared dependencies..."
cd shared && npm install && cd ..

# Server
echo "Installing server dependencies..."
cd server && npm install && cd ..

# Extension
echo "Installing extension dependencies..."
cd extension && npm install && cd ..

# Viewer
echo "Installing viewer dependencies..."
cd viewer && npm install && cd ..

echo "✅ All dependencies installed!"

