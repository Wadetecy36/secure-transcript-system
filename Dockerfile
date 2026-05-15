# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Configure npm with retry logic and timeouts for network resilience
RUN npm config set fetch-timeout=120000 && \
    npm config set fetch-retry-mintimeout=20000 && \
    npm config set fetch-retry-maxtimeout=120000 && \
    npm config set fetch-retries=5

# Install dependencies with npm ci (more reliable than npm install)
RUN npm ci

# Copy source code
COPY . .

# Build everything (Frontend + Server)
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only (including better-sqlite3 native build)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./

# Configure npm with retry logic and timeouts
RUN npm config set fetch-timeout=120000 && \
    npm config set fetch-retry-mintimeout=20000 && \
    npm config set fetch-retry-maxtimeout=120000 && \
    npm config set fetch-retries=5

# Install production dependencies with npm ci
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV IS_DOCKER=true

# Start the application
CMD ["npm", "run", "start"]
