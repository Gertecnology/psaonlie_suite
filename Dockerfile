# Build stage
# Node 22 y no 20: pnpm 11 usa `node:sqlite`, que recien existe desde Node 22.
# Con la 20 el install muere con ERR_UNKNOWN_BUILTIN_MODULE.
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm
# La version sale de `packageManager` en package.json: sin fijarla, cada build
# usaba la ultima publicada y el resultado cambiaba sin que nadie lo decidiera.
RUN corepack enable && corepack prepare --activate

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy .env file
COPY .env .env

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3002
EXPOSE 3002

# Start the app using serve
CMD ["serve", "-s", "dist", "-l", "3002"] 