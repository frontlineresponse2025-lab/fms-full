FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config files FIRST (critical for catalog: resolution)
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY .npmrc .
COPY package.json .

# Copy all package.json files (needed before install)
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/fms/package.json ./artifacts/fms/
COPY scripts/package.json ./scripts/

# Install dependencies using the lockfile (catalog entries are resolved from pnpm-workspace.yaml)
RUN pnpm install --frozen-lockfile

# Now copy the rest of the source
COPY . .

# Build in dependency order
RUN pnpm --filter @workspace/api-zod build || true
RUN pnpm --filter @workspace/db build || true
RUN pnpm --filter @workspace/api-server build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]