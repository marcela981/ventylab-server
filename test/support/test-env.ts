/*
 * Funcionalidad: Entorno explícito de pruebas
 * Descripción: Construye las variables de entorno de las suites de integración y e2e a partir de los contenedores locales (PostgreSQL y Mosquitto), fija un valor para cada clave de EnvironmentVariables para que ni .env ni dotenv ni Prisma aporten credenciales, vacía las llaves de proveedores de IA, Supabase, Sentry e InfluxDB, aísla los tópicos MQTT bajo test/<runId> y rechaza cualquier base de datos o broker que no sea local
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

import { TEST_DATABASE_URL_VAR, TEST_MQTT_URL_VAR, TEST_RUN_ID_VAR, TEST_SUPERADMIN_EMAIL } from "./test-constants";

export { TEST_SUPERADMIN_EMAIL };

const LOCAL_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "::1", "[::1]"];

// A closed local port: optional URL-typed settings cannot be blank (IsUrl rejects ""), so they point nowhere instead.
const UNREACHABLE_LOCAL_URL: string = "http://127.0.0.1:9";

const MUST_BE_BLANK_KEYS: readonly string[] = [
  "GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "AI_CUSTOM_HTTP_AUTH_HEADER", "AI_CUSTOM_HTTP_AUTH_VALUE",
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET",
  "SENTRY_DSN", "INFLUXDB_URL", "INFLUXDB_TOKEN", "MQTT_USERNAME", "MQTT_PASSWORD", "SMTP_USER", "SMTP_PASS",
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
];

export interface TestInfrastructure {
  readonly databaseUrl: string;
  readonly mqttUrl?: string;
  readonly runId: string;
}

export function readTestInfrastructure(env: NodeJS.ProcessEnv = process.env): TestInfrastructure {
  const databaseUrl: string | undefined = env[TEST_DATABASE_URL_VAR];
  const runId: string | undefined = env[TEST_RUN_ID_VAR];

  if (!databaseUrl || !runId) {
    throw new Error(`${TEST_DATABASE_URL_VAR} is not set: run integration and e2e suites through "npm run test:integration" or "npm run test:e2e" so the Jest globalSetup starts the test containers`);
  }

  const mqttUrl: string | undefined = env[TEST_MQTT_URL_VAR];

  return { databaseUrl, runId, mqttUrl: mqttUrl && mqttUrl.length > 0 ? mqttUrl : undefined };
}

export function testTopicPrefix(runId: string): string {
  return `test/${runId}`;
}

export function buildTestEnvironment(infrastructure: TestInfrastructure): Record<string, string> {
  const topicPrefix: string = testTopicPrefix(infrastructure.runId);

  return {
    NODE_ENV: "test",
    PORT: "0",
    DATABASE_URL: infrastructure.databaseUrl,
    DIRECT_URL: infrastructure.databaseUrl,
    JWT_SECRET: "test-jwt-secret-only-for-automated-tests",
    JWT_EXPIRES_IN: "15m",
    JWT_REFRESH_SECRET: "test-jwt-refresh-secret-only-for-automated-tests",
    JWT_REFRESH_EXPIRES_IN: "7d",
    ADMIN_API_KEY: "test-admin-api-key",
    SUPERADMIN_EMAIL: TEST_SUPERADMIN_EMAIL,
    ALLOWED_EMAIL_DOMAINS: "",
    CORS_ORIGIN: "http://localhost:3000",
    FRONTEND_URL: "http://localhost:3000",
    PRODUCTION_URL: "http://localhost:3000",
    VERCEL_URL: "",
    CORS_ALLOW_VERCEL_PREVIEWS: "false",
    THROTTLE_LIMIT: "100000",
    SWAGGER_ALLOWED_IPS: "",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "9",
    SMTP_FROM: "noreply@ventylab.test",
    MQTT_BROKER_URL: infrastructure.mqttUrl ?? "",
    MQTT_URL: "",
    MQTT_CLIENT_ID: `ventylab-test-${infrastructure.runId}`,
    MQTT_TEST_TOPIC_PREFIX: topicPrefix,
    // The app prefixes only command topics in NODE_ENV=test, so subscribed topics carry the prefix explicitly.
    MQTT_TELEMETRY_TOPIC: `${topicPrefix}/ventynet/data`,
    MQTT_ALARM_TOPIC: `${topicPrefix}/ventilab/device/001/alarm`,
    MQTT_COMMAND_TOPIC: "ventilab/device/001/command",
    MQTT_COMMAND_ACK_TOPIC: "",
    INFLUXDB_ORG: "",
    INFLUXDB_BUCKET: "",
    OPENAI_BASE_URL: UNREACHABLE_LOCAL_URL,
    ANTHROPIC_BASE_URL: UNREACHABLE_LOCAL_URL,
    AI_CUSTOM_HTTP_ENDPOINT: UNREACHABLE_LOCAL_URL,
    AI_USE_CASE_SETTINGS: "{}",
    AI_QUOTAS: "{}",
    AI_PRICES: "{}",
    ANALYTICS_EXPORT_SALT: "test-analytics-export-salt",
    APP_VERSION: "test",
    APP_COMMIT_SHA: "test",
    GIT_COMMIT: "test",
    ...Object.fromEntries(MUST_BE_BLANK_KEYS.map((key: string): [string, string] => [key, ""])),
  };
}

// Every declared configuration key gets a value, so nothing can be filled in later from .env by dotenv, ConfigModule or the Prisma client.
export function completeWithDeclaredDefaults(explicit: Record<string, string>): Record<string, string> {
  const declared: Record<string, unknown> = { ...new EnvironmentVariables() };

  if (!("DATABASE_URL" in declared) || !("GEMINI_API_KEY" in declared)) {
    throw new Error("Cannot enumerate EnvironmentVariables keys (class fields are not defined); refusing to run tests that could read .env");
  }

  const complete: Record<string, string> = {};

  for (const [key, value] of Object.entries(declared)) {
    complete[key] = explicit[key] ?? (typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "");
  }

  return { ...complete, ...explicit };
}

function hostOf(url: string, key: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`${key} is not a valid URL in the test environment`);
  }
}

export function assertLocalTestEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const value: string | undefined = env[key];

    if (!value || !LOCAL_HOSTS.includes(hostOf(value, key))) {
      throw new Error(`Refusing to run tests: ${key} must point to a local test container (localhost/127.0.0.1)`);
    }
  }

  const brokerUrl: string | undefined = env.MQTT_BROKER_URL;

  if (brokerUrl && !LOCAL_HOSTS.includes(hostOf(brokerUrl, "MQTT_BROKER_URL"))) {
    throw new Error("Refusing to run tests: MQTT_BROKER_URL must point to the local test broker");
  }

  for (const key of MUST_BE_BLANK_KEYS) {
    if (env[key]) {
      throw new Error(`Refusing to run tests: ${key} must be blank in the test environment`);
    }
  }

  if (env.NODE_ENV !== "test") {
    throw new Error("Refusing to run tests: NODE_ENV must be \"test\"");
  }
}

export function applyTestEnvironment(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const values: Record<string, string> = completeWithDeclaredDefaults(buildTestEnvironment(readTestInfrastructure(env)));

  Object.assign(env, values);
  assertLocalTestEnvironment(env);

  return values;
}
