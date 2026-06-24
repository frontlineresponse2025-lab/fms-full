FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy entire monorepo
COPY . .

# Install all dependencies
RUN pnpm install

# Build workspace packages first, then api-server
RUN pnpm --filter @workspace/api-zod build || true
RUN pnpm --filter @workspace/db build || true
RUN pnpm --filter @workspace/api-server build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
