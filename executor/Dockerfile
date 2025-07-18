
# Multi-stage build for better security
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    musl-dev \
    dumb-init

# Create a non-root user with minimal privileges
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup -s /bin/sh && \
    mkdir -p /app && \
    chown -R appuser:appgroup /app

# Set up the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies as root
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create a non-root user with minimal privileges
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup -s /bin/sh && \
    mkdir -p /app && \
    chown -R appuser:appgroup /app

# Set up the working directory
WORKDIR /app

# Copy node_modules and application from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/index.js ./
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Create necessary directories with proper permissions
RUN mkdir -p /tmp /var/tmp && \
    chown -R appuser:appgroup /tmp /var/tmp

# Security hardening
RUN apk add --no-cache \
    # Security updates
    && rm -rf /var/cache/apk/* \
    # Remove unnecessary files
    && rm -rf /usr/share/man /usr/share/doc /usr/share/info \
    # Set proper permissions
    && chmod 755 /app \
    && chmod 644 /app/package.json \
    && chmod 755 /app/index.js

# Switch to the non-root user
USER appuser

# Expose the port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "index.js"] 