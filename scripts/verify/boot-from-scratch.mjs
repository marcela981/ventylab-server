/*
 * Funcionalidad: Arranque desde cero (npm run verify:boot)
 * Descripción: Levanta un PostgreSQL desechable en Docker, aplica las migraciones, ejecuta el seed actual, compila la aplicación en una carpeta temporal ignorada por git y la arranca con un entorno mínimo (secretos ficticios, sin MQTT, almacenamiento, IA ni Sentry y sin leer .env), espera a que /health/ready responda 200 y siempre detiene la aplicación y elimina el contenedor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, relative } from "node:path";

import { startPostgres } from "./lib/postgres-container.mjs";
import { isMainModule, minimalEnv, REPO_ROOT, runNode, sleep, tail } from "./lib/process.mjs";

const READY_TIMEOUT_MS = 120_000;
const BUILD_ROOT = join(REPO_ROOT, ".tmp", "verify-boot");
const BUILD_OUT_DIR = join(BUILD_ROOT, "dist");
const BUILD_TSCONFIG = join(BUILD_ROOT, "tsconfig.verify-boot.json");

function freePort() {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();

    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();

      server.close(() => resolvePromise(port));
    });
  });
}

// Every required variable of env.validation.ts with a throwaway value; optional integrations stay unset so they boot disabled.
function appEnv(databaseUrl, port) {
  return minimalEnv({
    NODE_ENV: "development",
    PORT: String(port),
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    JWT_SECRET: "verify-boot-jwt-secret-0123456789abcdef",
    JWT_EXPIRES_IN: "15m",
    JWT_REFRESH_SECRET: "verify-boot-refresh-secret-0123456789abcdef",
    JWT_REFRESH_EXPIRES_IN: "7d",
    NEXTAUTH_SECRET: "verify-boot-nextauth-secret",
    NEXTAUTH_BRIDGE_SECRET: "verify-boot-bridge-secret",
    ADMIN_API_KEY: "verify-boot-admin-api-key",
    SUPERADMIN_EMAIL: "superadmin@verify.local",
    CORS_ORIGIN: "http://localhost:3000",
    FRONTEND_URL: "http://localhost:3000",
    PRODUCTION_URL: "http://localhost:3000",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "2525",
    SMTP_FROM: "no-reply@verify.local",
    APP_VERSION: "verify-boot",
  });
}

async function buildApp() {
  rmSync(BUILD_ROOT, { recursive: true, force: true });
  mkdirSync(BUILD_ROOT, { recursive: true });
  writeFileSync(BUILD_TSCONFIG, JSON.stringify({
    extends: join(REPO_ROOT, "tsconfig.build.json"),
    compilerOptions: { outDir: BUILD_OUT_DIR, tsBuildInfoFile: join(BUILD_ROOT, "tsconfig.tsbuildinfo") },
  }, null, 2));

  const build = await runNode("nest", ["build", "--path", relative(REPO_ROOT, BUILD_TSCONFIG)], { timeoutMs: 600_000 });

  if (build.code !== 0) {
    throw new Error(`nest build failed:\n${tail(build.output)}`);
  }
}

async function waitForReady(port, app) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastStatus = "no response";

  while (Date.now() < deadline) {
    if (app.exitCode !== null) {
      throw new Error(`the application exited with code ${app.exitCode} before it was ready`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/ready`, { signal: AbortSignal.timeout(3000) });

      lastStatus = `${response.status} ${await response.text()}`;

      if (response.status === 200) {
        return lastStatus;
      }
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }

    await sleep(1000);
  }

  throw new Error(`/health/ready did not answer 200 within ${READY_TIMEOUT_MS} ms (last: ${lastStatus})`);
}

function stopApp(app) {
  return new Promise((resolvePromise) => {
    if (app.exitCode !== null) {
      resolvePromise();

      return;
    }

    app.once("close", () => resolvePromise());
    app.kill();
    setTimeout(() => {
      if (app.exitCode === null) {
        app.kill("SIGKILL");
      }
    }, 10_000).unref();
  });
}

function removeIfEmpty(directory) {
  try {
    if (readdirSync(directory).length === 0) {
      rmSync(directory, { recursive: true, force: true });
    }
  } catch {
    // Nothing to clean up.
  }
}

export async function bootFromScratch({ log = console.log } = {}) {
  const container = await startPostgres("boot");
  let app;
  let appOutput = "";

  try {
    const databaseUrl = container.url();
    const prismaEnv = minimalEnv({ DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl });

    log(`[boot] container ${container.name} on 127.0.0.1:${container.port}`);

    const deploy = await runNode("prisma", ["migrate", "deploy"], { env: prismaEnv });

    if (deploy.code !== 0) {
      throw new Error(`prisma migrate deploy failed:\n${tail(deploy.output)}`);
    }

    log("[boot] migrations applied");

    const seed = await runNode("prisma", ["db", "seed"], { env: prismaEnv, timeoutMs: 600_000 });

    if (seed.code !== 0) {
      throw new Error(`prisma db seed failed:\n${tail(seed.output)}`);
    }

    log(`[boot] seed finished:\n${tail(seed.output, 5)}`);

    await buildApp();
    log("[boot] application built");

    const port = await freePort();

    // The working directory has no .env, so neither ConfigModule nor the Sentry reader can pick up real credentials.
    app = spawn(process.execPath, [join(BUILD_OUT_DIR, "main.js")], { cwd: BUILD_ROOT, env: appEnv(databaseUrl, port), windowsHide: true });
    app.stdout.on("data", (chunk) => {
      appOutput += chunk.toString();
    });
    app.stderr.on("data", (chunk) => {
      appOutput += chunk.toString();
    });

    const startedAt = Date.now();
    const ready = await waitForReady(port, app);

    log(`[boot] /health/ready answered ${ready} after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

    return { ok: true, detail: `migrate deploy + seed + boot OK; /health/ready ${ready}` };
  } catch (error) {
    return { ok: false, detail: `${error instanceof Error ? error.message : String(error)}${appOutput ? `\n--- application output ---\n${tail(appOutput, 40)}` : ""}` };
  } finally {
    if (app) {
      await stopApp(app);
      log("[boot] application stopped");
    }

    await container.remove();
    log(`[boot] container ${container.name} removed`);
    rmSync(BUILD_ROOT, { recursive: true, force: true });
    removeIfEmpty(join(REPO_ROOT, ".tmp"));
  }
}

if (isMainModule(import.meta.url)) {
  bootFromScratch()
    .then((result) => {
      console.log(result.ok ? `[boot] OK: ${result.detail}` : `[boot] FAILED: ${result.detail}`);
      process.exitCode = result.ok ? 0 : 1;
    })
    .catch((error) => {
      console.error(`[boot] ERROR: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
