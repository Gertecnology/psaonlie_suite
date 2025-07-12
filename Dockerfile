# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy .env file
COPY .env .env

# Set NODE_ENV to production before building
ENV NODE_ENV=production

# Build application
RUN pnpm build

# Remove devDependencies after build
RUN pnpm prune --prod

# Start the app
CMD ["pnpm", "preview", "--host", "--port", "3002"]

# Expose port 3002
EXPOSE 3002 