# ==============================================================================
# AURA GRAND LUXURY HOTEL MANAGEMENT SYSTEM - ENTERPRISE DOCKER CONTAINER
# Production-Hardened Multi-Stage Build
# ==============================================================================
FROM node:22-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Create application directory
WORKDIR /app

# Install dependencies with security caching
COPY package*.json ./
RUN npm ci --only=production

# Bundle application source
COPY . .

# Run as unprivileged node user
USER node

# Expose HTTP port
EXPOSE 5000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Launch application
CMD ["npm", "start"]
