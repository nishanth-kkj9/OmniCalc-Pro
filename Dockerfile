# Multi-stage Dockerfile for OmniCalc Pro Web Application
# Stage 1: Build
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server with Hardened Non-Root Security
FROM nginx:alpine@sha256:fdbfdaea4fc323f44590e9afeb271da8c345a733bf44c4ad7861201676a95f42

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy hardened Nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Setup directory permissions and PID path for non-root execution (UID 101: nginx)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

EXPOSE 3000

# Automated healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

