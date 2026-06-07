/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : e2e-config — Constantes y env de la auditoría E2E.
 * Descripción   : Centraliza endpoints, topics MQTT, timeouts y nombres
 *                 de eventos Socket.io. Todos los valores admiten override
 *                 por variable de entorno para no acoplar la auditoría a
 *                 una instalación particular. Defaults alineados con
 *                 SIMULATION_CONFIG (/ventynet/data, /ventynet/commands)
 *                 y NEXT_PUBLIC_API_URL (http://localhost:3001).
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import path from 'node:path';

export const E2E_CONFIG = {
  BASE_URL: process.env.AUDIT_BASE_URL ?? 'http://localhost:3001',
  JWT: process.env.AUDIT_JWT_TOKEN ?? '',
  MQTT_URL: process.env.MQTT_BROKER_URL ?? 'mqtt://test.mosquitto.org:1883',
  MQTT_TELEMETRY_TOPIC: process.env.MQTT_TELEMETRY_TOPIC ?? '/ventynet/data',
  MQTT_COMMAND_TOPIC: process.env.MQTT_COMMAND_TOPIC ?? '/ventynet/commands',
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

export const SERVER_ROOT = path.resolve(__dirname, '..', '..');
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..');
export const WEB_ROOT = path.resolve(REPO_ROOT, 'ventilab-web');
export const OUTPUT_DIR = path.resolve(SERVER_ROOT, 'audit-output');
