# ── Build stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY prisma/schema.prisma ./prisma/schema.prisma

RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build

# ── Production dependencies stage ───────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts

# ── Runtime stage ───────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node

EXPOSE 4000

CMD ["node", "dist/main"]
