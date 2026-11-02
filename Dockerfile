# ==============================================================================
# Stage 1: Build the Next.js Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV BACKEND_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_BACKEND_URL=/api/v1
ENV DOCKER_BUILD=1
RUN npm run build

# ==============================================================================
# Stage 2: Production Container (Python 3.11 + Node.js + Nginx + Supervisor)
# ==============================================================================
FROM python:3.11-slim

# Install system dependencies (Node.js 20, Nginx, Supervisor, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    nginx \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy & Install Python Backend Dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend Source Code
COPY backend/ /app/backend/

# Copy Standalone Next.js Build & Assets
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Copy Nginx & Supervisor Configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ensure storage directories exist and have open permissions for Hugging Face UID 1000
RUN mkdir -p /app/backend/storage/datasets /var/log/supervisor /var/run /run \
    && chmod -R 777 /app/backend/storage /var/log /var/run /run /etc/nginx

# Hugging Face Spaces default exposed port
EXPOSE 7860

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
