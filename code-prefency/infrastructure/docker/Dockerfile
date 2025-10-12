# Dockerfile for User Management System
# Multi-stage build for optimal image size

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/next-i18next.config.js ./

# Create non-root user and set permissions
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start application
CMD ["npm", "start"]

# Development stage (for local development)
FROM node:18-alpine AS development

WORKDIR /app

# Install development dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development
ENV PORT=3000

# Start development server
CMD ["npm", "run", "dev"]

# Testing stage
FROM node:18-alpine AS testing

WORKDIR /app

# Install all dependencies (including dev dependencies for testing)
COPY package*.json ./
COPY yarn.lock ./
RUN npm ci

# Copy source code and tests
COPY . .

# Run tests
RUN npm run test

# Linting stage
FROM node:18-alpine AS linting

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN npm ci

# Copy source code
COPY . .

# Run linting
RUN npm run lint

# Security scanning stage
FROM node:18-alpine AS security

WORKDIR /app

# Install security tools
RUN apk add --no-cache curl && \
    npm install -g npm-audit

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci

# Run security audit
RUN npm audit --audit-level=moderate

# Production security hardening
FROM production AS hardened

# Install security updates
RUN apk upgrade --no-cache

# Remove unnecessary packages
RUN apk del --no-cache curl

# Set security options
RUN chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Add security headers
RUN echo "ServerTokens Prod" > /etc/apache2/conf.d/security.conf && \
    echo "ServerSignature Off" >> /etc/apache2/conf.d/security.conf

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=512"

# Final production image
FROM hardened AS final

# Copy runtime configuration
COPY --from=builder /app/runtime-config.js ./

# Health check script
COPY healthcheck.js ./

# Set final permissions
RUN chmod +x healthcheck.js

# Labels for metadata
LABEL maintainer="Code Prefency Team"
LABEL version="1.0.0"
LABEL description="User Management System Docker Image"

# Default command
CMD ["npm", "start"]
