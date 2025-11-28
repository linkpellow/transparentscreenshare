# Dockerfile for Usha Server

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package.json ./
COPY shared/package.json ../shared/

# Install dependencies
RUN npm install --production

# Copy built files
COPY server/dist ./dist
COPY viewer/dist ../viewer/dist
COPY shared/dist ../shared/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]

