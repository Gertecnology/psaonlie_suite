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

# Las variables que vienen del entorno de GitHub, para no tenerlas versionadas.
#
# Vite hornea en el bundle todo lo que empiece con `VITE_`, y toma tanto el
# `.env` del repo como las variables del proceso: estas ganan sobre aquel. Es
# el camino por el que salen las nuevas — el `.env` versionado se mantiene
# mientras queden las viejas.
#
# La del SDK de Bancard estaba en el `.env` con el prefijo `NEXT_PUBLIC_`,
# copiado del `.env` de la landing, que sí es Next.js. Vite no expone ese
# prefijo, así que al panel le llegaba vacía y el pago con tarjeta nunca
# llegaba a abrirse.
ARG VITE_BANCARD_SDK_URL
ENV VITE_BANCARD_SDK_URL=${VITE_BANCARD_SDK_URL}

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