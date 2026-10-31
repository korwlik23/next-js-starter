# syntax=docker/dockerfile:1

# Rebuild the source code only when needed
FROM node:24-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# openssl: the Prisma engine detects and links against it (missing = "failed to detect libssl")
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable corepack for pnpm/yarn, though we are using npm here
# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# NEXT_PUBLIC_* are inlined into the client bundle at build time — pass them as build args
ARG NEXT_PUBLIC_APP_NAME="Next.js Starter"
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_ROOT_DOMAIN=""
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN

# Build Next.js
# `next build` loads route modules that validate secrets at import time. Give this one
# command build-only placeholders; they are not kept in any layer and the runner stage
# gets the real values from the container environment.
RUN DATABASE_URL="mysql://build:build@localhost:3306/build" \
    JWT_SECRET="build-time-placeholder-not-used-at-runtime-000000" \
    npm run build

# Production image, copy all the files and run next
FROM node:24-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy prisma schema so we can use prisma commands in prod if needed, and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# It requires "output: 'standalone'" in next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
