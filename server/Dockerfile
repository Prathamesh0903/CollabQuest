# syntax=docker/dockerfile:1
# Use Debian-based image (easier native builds for node-pty)
FROM node:18-bullseye-slim

# Install system deps needed by node-gyp and node-pty, plus dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Ensure node-gyp finds Python
ENV PYTHON=/usr/bin/python3

# Create app directory
WORKDIR /app

# Install production dependencies first (better cache)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild native modules for the container environment (skip on Render)
# RUN npm rebuild node-pty

# Copy the rest of the source
COPY . .

# Create non-root user and set ownership
RUN useradd -m -u 10001 appuser && chown -R appuser /app
USER appuser

# Expose the API port
EXPOSE 5001

# Entrypoint handles signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server.js"]