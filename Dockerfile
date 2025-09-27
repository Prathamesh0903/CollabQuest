# This Dockerfile is intentionally minimal to prevent Docker usage
# Render should use the render.yaml configuration instead
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy server code
COPY server/ .

# Expose port
EXPOSE 10000

# Start command
CMD ["npm", "run", "start:render"]
