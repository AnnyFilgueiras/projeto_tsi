# Production image for the Panelada API (Cloud 4C on Render, also used by local Docker Compose).
# Build from the repository root: docker build -f apps/api/Dockerfile .

# --- deps: standalone API bundle with production node_modules only (no pnpm in the final image) ---
FROM node:22-alpine AS deps

WORKDIR /repo

RUN npm install -g pnpm@10.11.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/allergen-rules ./packages/allergen-rules
COPY apps/api ./apps/api

# `pnpm deploy` keeps only the API dependency graph: with the hoisted linker a filtered install
# would still pull the whole lockfile (React Native, Expo) into the image. Installing on Alpine
# fetches sharp's linuxmusl prebuilt binary, which matches the runtime stage.
RUN pnpm --filter @panelada/api deploy --prod --legacy /out

# --- runtime ---
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV TZ=UTC
ENV HOST=0.0.0.0
ENV PORT=3000
# Writable by the non-root user, unlike the default `<cwd>/.data/photos` under /app.
ENV PHOTO_STORAGE_DIR=/data/photos

WORKDIR /app

COPY --from=deps /out ./

# Local photo driver target (Docker Compose volume); owned by the unprivileged runtime user.
RUN mkdir -p /data/photos && chown node:node /data/photos

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Runtime stays on tsx because @panelada/allergen-rules exports raw .ts. Migrations run on boot:
# Render Free has no pre-deploy hook, and Drizzle migrations are idempotent on a single instance.
# `exec` hands PID 1 to Node so SIGTERM from the platform reaches the graceful shutdown handler.
CMD ["sh", "-c", "node --import tsx src/db/migrate.ts && exec node --import tsx src/main.ts"]
