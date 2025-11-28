# Dockerfile for Usha Server

FROM node:18-alpine

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY shared/package.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src
COPY server/package.json ./server/
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
COPY viewer/package.json ./viewer/
COPY viewer/tsconfig.json ./viewer/
COPY viewer/vite.config.ts ./viewer/
COPY viewer/src ./viewer/src
COPY viewer/index.html ./viewer/

# Install root dependencies
RUN npm install

# Install and build shared package
WORKDIR /app/shared
RUN npm install && npm run build

# Install and build viewer
WORKDIR /app/viewer
RUN npm install && npm run build

# Install server dependencies and build
WORKDIR /app/server
RUN npm install && npm run build

# Go back to server directory for runtime
WORKDIR /app/server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]

