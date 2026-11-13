/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : e2e-config — Constantes y env de la auditoría E2E.
 * Descripción   : Centraliza endpoints, topics MQTT, timeouts y nombres
 *                 de eventos Socket.io. Todos los valores admiten override
 *                 por variable de entorno para no acoplar la auditoría a
 *                 una instalación particular. v1.1: defaults del stack
 *                 local de docker-compose.local.yml (backend
 *                 http://127.0.0.1:4000, broker mqtt://127.0.0.1:<MQTT_PUBLIC_PORT
 *                 o 1883>, tópicos /ventynet/data y
 *                 ventilab/device/001/command); solo variables AUDIT_*
 *                 (nunca MQTT_BROKER_URL, que lib/prisma carga del .env
 *                 real), credenciales AUDIT_MQTT_* o, en broker local,
 *                 las del dispositivo de deploy/local/compose.env, y bandera
 *                 --allow-remote-test-broker para la guarda de broker.
 *                 v1.2: la auditoría ya no importa lib/prisma (ni
 *                 dotenv): las opt-in de G2 (--allow-command-audit) y G4
 *                 (AUDIT_DATABASE_URL) viven en audit-guards.ts.
 * Versión       : 1.2
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import path from 'node:path';
import { defaultLocalBrokerUrl, resolveCredentials } from './local-broker';

export const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const MQTT_URL = process.env.AUDIT_BROKER_URL ?? defaultLocalBrokerUrl();
// Explicit AUDIT_MQTT_* credentials win; a local broker falls back to the device user of deploy/local/compose.env.
const MQTT_CREDENTIALS = resolveCredentials(
  MQTT_URL,
  { username: process.env.AUDIT_MQTT_USERNAME, password: process.env.AUDIT_MQTT_PASSWORD },
  SERVER_ROOT,
);

export const E2E_CONFIG = {
  BASE_URL: process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4000',
  JWT: process.env.AUDIT_JWT_TOKEN ?? '',
  MQTT_URL,
  MQTT_USERNAME: MQTT_CREDENTIALS.username,
  MQTT_PASSWORD: MQTT_CREDENTIALS.password,
  ALLOW_REMOTE_TEST_BROKER: process.argv.includes('--allow-remote-test-broker'),
  MQTT_TELEMETRY_TOPIC: process.env.AUDIT_TELEMETRY_TOPIC ?? '/ventynet/data',
  MQTT_COMMAND_TOPIC: process.env.AUDIT_COMMAND_TOPIC ?? 'ventilab/device/001/command',
  TELEMETRY_FRAMES: 60,
  TELEMETRY_INTERVAL_MS: 33,
  TELEMETRY_P95_BUDGET_MS: 100,
  TELEMETRY_LOSS_BUDGET: 0.02,
  TELEMETRY_THROUGHPUT_HZ: 30,
  COMMAND_BUDGET_MS: 200,
  SIMULATION_FRAMES: 100,
  SIMULATION_PEEP_DELTA_TOLERANCE: 0.2,
  SIMULATION_TOLERANCE: 0.15,
  CONNECT_TIMEOUT_MS: 5_000,
} as const;

export const REPO_ROOT = path.resolve(SERVER_ROOT, '..');
export const WEB_ROOT = path.resolve(REPO_ROOT, 'ventilab-web');
export const OUTPUT_DIR = path.resolve(SERVER_ROOT, 'audit-output');
