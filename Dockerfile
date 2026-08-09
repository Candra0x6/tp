FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm 10
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

# Copy root monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/chain-client/package.json ./packages/chain-client/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/
COPY contracts/package.json ./contracts/

# Install dependencies
RUN pnpm install

# Copy source files
COPY . .

# Build packages & backend
RUN pnpm --filter @trust-fall/types build
RUN pnpm --filter @trust-fall/chain-client build
RUN pnpm --filter @trust-fall/backend build

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "apps/backend/dist/main.js"]
