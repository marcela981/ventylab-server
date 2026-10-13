# Funcionalidad: Imagen de producción del backend
# Descripción: Construcción multietapa: compila NestJS y genera el cliente Prisma, instala solo dependencias de producción, instala el CLI de Prisma aislado para aplicar migraciones al arrancar y produce una imagen mínima que corre como usuario no root con HEALTHCHECK sobre /health/ready
# Versión: 1.1
# Autor: Marcela Mazo Castro
# Proyecto: VentyLab
# Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
# Institución: Universidad del Valle
# Contacto: marcela.mazo@correounivalle.edu.co

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

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ── Migration CLI stage ─────────────────────────────────────────────────
# prisma is a devDependency, so the CLI used by `prisma migrate deploy` is installed apart,
# pinned to the exact version of the lockfile, with its install scripts so the schema engine is downloaded at build time.
FROM node:22-alpine AS prisma-cli

RUN apk add --no-cache openssl

WORKDIR /opt/prisma-cli

COPY package-lock.json /tmp/package-lock.json

RUN PRISMA_VERSION="$(node -p "require('/tmp/package-lock.json').packages['node_modules/prisma'].version")" \
  && npm init -y > /dev/null \
  && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}" \
  && npx prisma --version \
  && npm cache clean --force

# ── Runtime stage ───────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production \
  PORT=4000 \
  CHECKPOINT_DISABLE=1 \
  PRISMA_HIDE_UPDATE_MESSAGE=1

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-cli /opt/prisma-cli/node_modules /opt/prisma-cli/node_modules
COPY --from=build /app/dist ./dist
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
COPY package.json ./
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 4000

# start-period covers `prisma migrate deploy` plus the Nest boot.
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health/ready').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["node", "dist/main"]
