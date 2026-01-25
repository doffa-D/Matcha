FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Development stage
FROM base AS dev
EXPOSE 3000
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
ARG VITE_API_URL
ARG VITE_IMAGES_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_IMAGES_URL=$VITE_IMAGES_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
