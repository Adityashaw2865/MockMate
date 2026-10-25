# Build context: repository root  (docker build -f apps/server/Dockerfile .)
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* && corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/server ./apps/server
RUN pnpm install --filter server... && pnpm --filter server exec prisma generate
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter server exec prisma db push --skip-generate && pnpm --filter server exec tsx src/index.ts"]
