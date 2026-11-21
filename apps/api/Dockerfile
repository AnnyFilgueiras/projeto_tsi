FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@10.11.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/allergen-rules/package.json ./packages/allergen-rules/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter @panelada/api... --filter @panelada/allergen-rules...

COPY packages/allergen-rules ./packages/allergen-rules
COPY apps/api ./apps/api

ENV NODE_ENV=development
ENV TZ=UTC
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "@panelada/api", "start"]
