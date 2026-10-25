# Build context: repository root  (docker build -f apps/web/Dockerfile .)
FROM node:20-slim
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API=http://localhost:4000
ARG NEXT_PUBLIC_WS=ws://localhost:4000
ENV NEXT_PUBLIC_API=$NEXT_PUBLIC_API NEXT_PUBLIC_WS=$NEXT_PUBLIC_WS
RUN pnpm install --filter web... && pnpm --filter web build
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
