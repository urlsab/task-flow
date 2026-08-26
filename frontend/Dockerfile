# ── Stage 1: Build ────────────────────────────────────────────────────────
# The Node image compiles the TypeScript and bundles everything.
# It's ~1 GB but is NEVER shipped — only the output files move to stage 2.
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first. Docker caches this layer; if package.json doesn't
# change, npm ci is skipped on subsequent builds (saves ~60s per rebuild).
COPY package*.json ./
RUN npm ci --silent

COPY . .
# --configuration=production uses environment.ts (apiUrl: '') not environment.development.ts
RUN npm run build -- --configuration=production

# ── Stage 2: Serve ────────────────────────────────────────────────────────
# nginx:alpine is ~25 MB. The Node SDK is not present in this final image.
FROM nginx:alpine AS serve
# Copy only the compiled static files from stage 1
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Replace the default nginx config with ours (adds /api proxy + SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
