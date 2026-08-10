# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies (cached separately from source so `npm ci` only
# re-runs when package.json actually changes, not on every code edit) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Production image ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# node:alpine images ship a non-root "node" user already — use it instead
# of running as root, so a container compromise doesn't hand over root
# inside the container.
USER node

EXPOSE 5000
CMD ["node", "src/server.js"]