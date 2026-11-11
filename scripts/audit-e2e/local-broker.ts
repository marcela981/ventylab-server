/*
 * Funcionalidad: local-broker — Guarda de broker MQTT para los scripts de prueba
 * Descripción: Broker por defecto del stack local de docker-compose.local.yml (mqtt://127.0.0.1:<MQTT_PUBLIC_PORT o 1883>),
 *              rechazo de brokers fuera de esta máquina salvo --allow-remote-test-broker, rechazo SIEMPRE de los brokers
 *              públicos conocidos (sin excepción) y lectura de las credenciales del dispositivo desde
 *              deploy/local/compose.env por nombre de variable (los valores nunca se imprimen). Lo usan
 *              scripts/simulate-ventilator.ts y scripts/audit-e2e. Pruebas: node --test scripts/audit-e2e/local-broker.test.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Hosts of this machine plus the broker service name of the local docker-compose stack. */
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]", "mosquitto"]);

/** Public brokers anyone can subscribe to: always refused, there is no override. */
export const PUBLIC_BROKER_HOSTS = ["broker.hivemq.com", "test.mosquitto.org", "broker.emqx.io", "mqtt.eclipseprojects.io"];

export const DEVICE_USERNAME = "ventylab-device";

export function defaultLocalBrokerUrl(env: NodeJS.ProcessEnv = process.env): string {
  return `mqtt://127.0.0.1:${env.MQTT_PUBLIC_PORT || "1883"}`;
}

function isPublicHost(host: string): boolean {
  return PUBLIC_BROKER_HOSTS.some((publicHost) => host === publicHost || host.endsWith(`.${publicHost}`));
}

export function isLocalBroker(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Why the broker must not be used, or null. The message never prints the url (it may carry credentials). */
export function brokerRefusal(url: string, allowRemoteTestBroker: boolean): string | null {
  let host: string;

  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "the broker is not a valid URL (e.g. mqtt://127.0.0.1:1883).";
  }

  if (isPublicHost(host)) {
    return `${host} is a public broker: synthetic data must never reach it (no override).`;
  }

  if (!LOCAL_HOSTS.has(host) && !allowRemoteTestBroker) {
    return `${host} is not on this machine and could be the lab broker of the physical ventilator. Use the local stack broker or pass --allow-remote-test-broker if it is a TEST broker.`;
  }

  return null;
}

/** Device credentials of the local stack (deploy/local/compose.env, MQTT_DEVICE_PASSWORD), or undefined when the file is missing. */
export function localDeviceCredentials(serverRoot: string): { username: string; password: string } | undefined {
  let text: string;

  try {
    text = readFileSync(join(serverRoot, "deploy", "local", "compose.env"), "utf8");
  } catch {
    return undefined;
  }

  const match = /^MQTT_DEVICE_PASSWORD=(.*)$/mu.exec(text);
  const password = match?.[1].trim().replace(/^(['"])(.*)\1$/u, "$2");

  return password ? { username: DEVICE_USERNAME, password } : undefined;
}

/** Explicit credentials win; otherwise a local broker uses the device credentials of the local stack. */
export function resolveCredentials(
  url: string,
  explicit: { username?: string; password?: string },
  serverRoot: string,
): { username?: string; password?: string } {
  if (explicit.username || explicit.password) {
    return explicit;
  }

  return isLocalBroker(url) ? (localDeviceCredentials(serverRoot) ?? {}) : {};
}
