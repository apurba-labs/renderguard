FROM node:22-alpine AS deps

WORKDIR /app

COPY web/package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

ARG NEXT_PUBLIC_RENDERGUARD_API_URL
ARG NEXT_PUBLIC_RENDERGUARD_AGENT_URL

ENV NEXT_PUBLIC_RENDERGUARD_API_URL=${NEXT_PUBLIC_RENDERGUARD_API_URL}
ENV NEXT_PUBLIC_RENDERGUARD_AGENT_URL=${NEXT_PUBLIC_RENDERGUARD_AGENT_URL}

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
