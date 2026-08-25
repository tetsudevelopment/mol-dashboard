# syntax=docker/dockerfile:1

# =============================================================================
# MOLTECH Dashboard — production image
#
# Multi-stage build producing a minimal Next.js standalone server.
# Listens on port 3011. Liveness probe: GET /api/health
#
# IMPORTANT: NEXT_PUBLIC_* values are inlined into the client bundle by
# `next build`, so they MUST be supplied as build args. The resulting image is
# bound to one backend URL — build a separate image per environment.
# =============================================================================

ARG NODE_VERSION=24-alpine

# -----------------------------------------------------------------------------
# Stage 1 — dependencies
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
# Next.js' SWC binaries need glibc compatibility shims on Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2 — build
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Backend base URL, without trailing slash (e.g. https://backmolapi.vepay.com.co)
ARG NEXT_PUBLIC_API_URL
# API version prefix used by the backend (e.g. "v1" -> /api/v1/...)
ARG NEXT_PUBLIC_API_VERSION=v1

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_API_VERSION=${NEXT_PUBLIC_API_VERSION} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Fail early with an actionable message instead of a Zod stack trace mid-build.
RUN if [ -z "${NEXT_PUBLIC_API_URL}" ]; then \
      echo "ERROR: build arg NEXT_PUBLIC_API_URL is required." >&2; \
      echo "       Example: --build-arg NEXT_PUBLIC_API_URL=https://backmolapi.vepay.com.co" >&2; \
      exit 1; \
    fi

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Requires network access: next/font/google downloads the Geist faces at build time.
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — runtime
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3011 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# The standalone server already bundles the node_modules it needs.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# server.js serves these two only when they sit next to it.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3011

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3011)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
