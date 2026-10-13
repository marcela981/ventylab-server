/*
 * Funcionalidad: Contenedores de prueba
 * Descripción: Arranca con Testcontainers un PostgreSQL 17 desechable (aplica prisma migrate deploy con un entorno mínimo y URL explícita, apunta app_settings.superadmin_email al superadmin de prueba y guarda en el esquema test_baseline las filas sembradas por las migraciones) y, cuando se pide, un broker eclipse-mosquitto:2 con configuración anónima solo para pruebas; los detiene en el teardown; también arranca brokers adicionales que una prueba de resiliencia puede detener y reemplazar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";

import { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

import { BASELINE_SCHEMA, TEST_DATABASE_URL_VAR, TEST_MQTT_URL_VAR, TEST_RUN_ID_VAR, TEST_SUPERADMIN_EMAIL } from "./test-constants";

export const REPO_ROOT: string = resolve(__dirname, "..", "..");

const POSTGRES_IMAGE: string = "postgres:17-alpine";
const MOSQUITTO_IMAGE: string = "eclipse-mosquitto:2";
const MQTT_PORT: number = 1883;

// Anonymous access is acceptable only because this broker lives inside a throwaway container bound to the test run.
const MOSQUITTO_TEST_CONFIG: string = [
  "listener 1883 0.0.0.0",
  "allow_anonymous true",
  "persistence false",
  "log_dest stdout",
  "",
].join("\n");

const INHERITED_ENV_KEYS: readonly string[] = [
  "PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "windir", "ComSpec", "TEMP", "TMP", "TMPDIR",
  "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "ProgramData",
];

interface TestContainersState {
  postgres?: StartedPostgreSqlContainer;
  mosquitto?: StartedTestContainer;
}

const STATE_KEY: string = "__VENTYLAB_TEST_CONTAINERS__";

function state(): TestContainersState {
  const holder: Record<string, TestContainersState | undefined> = globalThis as unknown as Record<string, TestContainersState | undefined>;
  const current: TestContainersState = holder[STATE_KEY] ?? {};

  holder[STATE_KEY] = current;

  return current;
}

function minimalEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const key of INHERITED_ENV_KEYS) {
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }

  return { ...env, ...extra };
}

function migrate(databaseUrl: string): void {
  const result: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [join(REPO_ROOT, "node_modules", "prisma", "build", "index.js"), "migrate", "deploy"],
    { cwd: REPO_ROOT, env: minimalEnv({ DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl }), encoding: "utf-8", windowsHide: true },
  );

  if (result.status !== 0) {
    throw new Error(`prisma migrate deploy failed on the test container:\n${result.stdout}\n${result.stderr}`);
  }
}

async function snapshotBaseline(databaseUrl: string): Promise<void> {
  const prisma: PrismaClient = new PrismaClient({ datasourceUrl: databaseUrl });

  try {
    await prisma.$executeRawUnsafe("UPDATE \"app_settings\" SET \"value\" = lower($1), \"updatedAt\" = CURRENT_TIMESTAMP WHERE \"key\" = 'superadmin_email'", TEST_SUPERADMIN_EMAIL);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${BASELINE_SCHEMA}"`);

    const tables: { tablename: string }[] = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
    );

    for (const { tablename } of tables) {
      const rows: { count: bigint }[] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM public."${tablename}"`);

      if (rows[0].count > 0n) {
        await prisma.$executeRawUnsafe(`CREATE TABLE "${BASELINE_SCHEMA}"."${tablename}" AS TABLE public."${tablename}"`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

export async function startTestPostgres(): Promise<string> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase("ventylab_test")
    .withUsername("ventylab_test")
    .withPassword("ventylab_test")
    .start();

  state().postgres = container;

  const databaseUrl: string = `postgresql://ventylab_test:ventylab_test@${container.getHost()}:${container.getPort()}/ventylab_test?schema=public`;

  migrate(databaseUrl);
  await snapshotBaseline(databaseUrl);

  return databaseUrl;
}

export async function startMosquittoContainer(): Promise<StartedTestContainer> {
  return await new GenericContainer(MOSQUITTO_IMAGE)
    .withCopyContentToContainer([{ content: MOSQUITTO_TEST_CONFIG, target: "/mosquitto/config/mosquitto.conf" }])
    .withExposedPorts(MQTT_PORT)
    .withWaitStrategy(Wait.forLogMessage(/mosquitto version .* running/))
    .start();
}

export function mosquittoUrl(container: StartedTestContainer): string {
  return `mqtt://${container.getHost()}:${container.getMappedPort(MQTT_PORT)}`;
}

export async function startTestMosquitto(): Promise<string> {
  const container: StartedTestContainer = await startMosquittoContainer();

  state().mosquitto = container;

  return mosquittoUrl(container);
}

export async function startTestInfrastructure(options: { mqtt: boolean }): Promise<void> {
  const runId: string = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;

  process.env[TEST_RUN_ID_VAR] = runId;
  process.env[TEST_DATABASE_URL_VAR] = await startTestPostgres();
  process.env[TEST_MQTT_URL_VAR] = options.mqtt ? await startTestMosquitto() : "";
}

export async function stopTestInfrastructure(): Promise<void> {
  const current: TestContainersState = state();

  await Promise.all([current.mosquitto?.stop(), current.postgres?.stop()]);

  current.mosquitto = undefined;
  current.postgres = undefined;
}
