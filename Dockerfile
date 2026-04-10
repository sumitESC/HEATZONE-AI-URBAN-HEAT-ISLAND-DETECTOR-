# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-slim AS builder

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config first (for better Docker cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all packages
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

# Install all dependencies (including native compilation of better-sqlite3)
RUN pnpm install --frozen-lockfile

# Build shared libraries
RUN pnpm --filter "@workspace/db" run push 2>/dev/null || true
RUN pnpm --filter "@workspace/api-zod" run build 2>/dev/null || true
RUN pnpm --filter "@workspace/api-client-react" run build 2>/dev/null || true

# Build frontend (Vite → dist/)
RUN pnpm --filter "@workspace/heatzone-ai" run build

# Build backend (esbuild → dist/index.cjs)
RUN pnpm --filter "@workspace/api-server" run build


# ── Stage 2: Production ────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Copy the entire node_modules from builder (includes compiled better-sqlite3)
COPY --from=builder /app/node_modules ./node_modules

# Copy the built backend bundle
COPY --from=builder /app/artifacts/api-server/dist/index.cjs ./index.cjs

# Copy the built frontend into a 'public' folder the server serves
COPY --from=builder /app/artifacts/heatzone-ai/dist ./public

# Database directory
RUN mkdir -p /app/data
ENV DATABASE_URL=/app/data/sqlite.db

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "index.cjs"]
