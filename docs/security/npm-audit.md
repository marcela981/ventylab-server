<!--
  Funcionalidad: Auditoría de dependencias de producción
  Descripción: Resultado de npm audit --omit=dev antes y después de las actualizaciones sin cambio mayor, paquetes actualizados, justificación de alcanzabilidad por cada aviso crítico o alto que no se puede corregir sin un cambio mayor y funcionamiento del script security:audit con su archivo de excepciones
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# npm audit (production dependencies)

Observed on 2026-10-13 with npm 12.0.2, Node 22.23.2, `npm audit --omit=dev --json`.

## Gate

`npm run security:audit` (`scripts/security/audit.mjs`, no dependencies) runs the audit, collects every **critical or high advisory** (by GHSA id) and fails with exit 1 when one is not listed in `security/audit-exceptions.json` or its `reviewBy` date has passed. Exceptions that are no longer reported are printed as stale. Exit 2 means npm audit returned no report (no network). `--exceptions <file>` uses another exceptions file (with an empty list the gate fails, exit 1, observed).

Each exception needs `id`, `reason` (why it is not reachable in this app) and `reviewBy` (`YYYY-MM-DD`); the current ones expire on 2027-01-15.

## Raw summary

| | critical | high | moderate | low | total (packages) |
|---|---|---|---|---|---|
| Before | 1 | 15 | 3 | 0 | 19 |
| After `npm update` (lockfile only) | 0 | 8 | 2 | 0 | 10 |

The 8 remaining "high" packages come from 6 advisories: `prisma`, `@prisma/config`, `deepmerge-ts`, `effect` are one chain (2 advisories), `nestjs-i18n`, `chokidar`, `braces` another (1 advisory), plus `nodemailer` (3 high advisories; 5 more are moderate).

## Fixed without a breaking change

`npm update compression @nestjs/swagger defu engine.io ip-address js-yaml picomatch proxy-addr socket.io-adapter socket.io-parser ws` changed only `package-lock.json` (no range in `package.json` changed, no major bump):

| Package | From → to | Advisories closed |
|---|---|---|
| proxy-addr (via express) | 2.0.7 → 2.0.8 | GHSA-jqcg-44mw-7w3h (critical: IP spoofing through IPv4-mapped IPv6 trust subnets; relevant because `trust proxy` is set) |
| compression | 1.8.1 → 1.8.2 | GHSA-vc2v-76pw-4v95 |
| engine.io | 6.6.5 → 6.6.11 | GHSA-r635-g3xr-vw7x, GHSA-gr94-w7qr-f4j3, GHSA-2gc4-cqfq-p2gv |
| socket.io-parser | 4.2.5 → 4.2.7 | GHSA-677m-j7p3-52f9, GHSA-2m8v-j782-fhvr |
| socket.io-adapter | 2.5.6 → 2.5.8 | moderate (via ws) |
| ws (nested copies under engine.io and socket.io-adapter) | 8.18.3 → deduplicated to 8.21.3 | GHSA-58qx-3vcg-4xpx, GHSA-96hv-2xvq-fx4p |
| ip-address | 10.1.0 → 10.7.4 | GHSA-v2v4-37r5-5v8g, GHSA-mwp4-54f8-5fhr, GHSA-rpw4-54j3-4h4q, GHSA-j6r3-76f7-8jcv, GHSA-h3mg-xc3c-68pw |
| picomatch | 2.3.1 → 2.3.2 (and a nested 4.0.3 → 4.0.7) | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj |
| defu | 6.1.4 → 6.1.7 | GHSA-737v-mqg7-c878 |
| js-yaml (root copy) | 3.14.2 → 3.15.2 | — |

`npm audit fix --force` was not used. The remaining moderate advisory of `@nestjs/swagger` (its nested `js-yaml` 5.3.0, GHSA-r3ph-w7gj-g6xm, CPU use of YAML merge keys) only affects YAML parsing of documents this app generates itself; it is below the gate.

## Accepted advisories (not fixable without a breaking change)

| Advisory | Package (path) | Why it is not reachable here | Fix available |
|---|---|---|---|
| GHSA-ggr8-5vv4-36mx (high) | deepmerge-ts 7.1.5 (`prisma` → `@prisma/config`) | Stack exhaustion merging recursive objects. Only the Prisma CLI config loader uses it, on this repository's config, at `prisma generate`/`migrate deploy` time. Loading `@prisma/client` loads no module of `@prisma/config`, `effect` or `deepmerge-ts` (checked with `require.cache`). | Only a downgrade to prisma 6.12 (every 6.13–8.1 release ships it). |
| GHSA-38f7-945m-qr2g (high) | effect 3.18.4 (`prisma` → `@prisma/config`) | AsyncLocalStorage contamination in Effect fibers under concurrent RPC load. Effect runs only inside the single-shot CLI config loader; the API never runs Effect fibers. | Same as above. |
| GHSA-vfj7-8cjw-p6xm (high) | braces 3.0.3 (`nestjs-i18n` → `chokidar@3`) | Stack exhaustion expanding nested brace patterns. chokidar only receives the fixed translation directory from `app.module.ts`, never request data. | None for braces (all versions); npm proposes a nestjs-i18n major downgrade (5.x). |
| GHSA-p6gq-j5cr-w38f (high) | nodemailer 8.0.11 (direct) | `raw` message option bypasses file/URL access limits. `EmailModule` registers the Nodemailer service, but no feature injects `EMAIL_SERVICE_TOKEN`: the app never builds a message. | nodemailer 9+/10.1 (semver major). |
| GHSA-2x7j-588g-ccc2 (high) | nodemailer 8.0.11 | Quadratic addressparser time with a crafted address list; no address is ever parsed because nothing sends email. | nodemailer 9.1+ (major). |
| GHSA-v53p-9fqp-m79j (high) | nodemailer 8.0.11 | Quadratic backtracking in the addressparser fallback; same reachability as above. | nodemailer 10.1 (major). |

Recommended follow-ups (author decision, out of this block's scope): upgrade nodemailer to 10.x the day email sending is wired (or remove the unused `EmailModule` dependency); revisit Prisma when a 6.x/7.x release drops the vulnerable `effect`/`deepmerge-ts`.
