# ── Stage 1: Build ────────────────────────────────────────────────────────
# The Node image compiles the TypeScript and bundles everything.
# It's ~1 GB but is NEVER shipped — only the output files move to stage 2.
FROM node:22-alpine AS build
WORKDIR /app

# Install Netfree SSL certificate so npm can reach the registry through the filter
ADD https://netfree.link/cacert/united/x2/unix.sh /home/netfree-unix-ca.sh
RUN cat /home/netfree-unix-ca.sh | sh
ENV NODE_EXTRA_CA_CERTS=/etc/ca-bundle.crt

COPY package*.json ./
RUN npm ci --silent --legacy-peer-deps

COPY . .
# --configuration=production uses environment.ts (apiUrl: '') not environment.development.ts
RUN npm run build -- --configuration=production

# ── Stage 2: Serve ────────────────────────────────────────────────────────
# nginx:alpine is ~25 MB. The Node SDK is not present in this final image.
FROM nginx:alpine AS serve
# Copy only the compiled static files from stage 1
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# nginx processes *.template files in /etc/nginx/templates/ with envsubst at startup.
# This lets API_URL be injected at runtime without rebuilding the image.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Default for Docker Compose local dev — Railway overrides this env var per service
ENV API_URL=http://gateway:5000
EXPOSE 80
