FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install

COPY . .

ENV DATABASE_URL="file:./data/app.db"
RUN mkdir -p data && pnpm db:generate && pnpm db:push

# Seed sample data if present
RUN pnpm seed:excel || true

RUN pnpm build

WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3344
EXPOSE 3344

CMD ["pnpm", "start"]
