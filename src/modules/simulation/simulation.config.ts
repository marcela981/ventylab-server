/*
 * Funcionalidad: SimulationConfig
 * Descripción: Configuración centralizada del módulo de simulación leída desde variables de entorno.
 *              Proporciona defaults seguros para desarrollo local.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria
 *        que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

const rawMaxHz = parseInt(process.env.WS_MAX_HZ ?? '30', 10);

const WS_MAX_HZ = (() => {
  if (isNaN(rawMaxHz) || rawMaxHz <= 0) {
    console.warn('[SimulationConfig] WS_MAX_HZ inválido, usando 30');
    return 30;
  }
  return rawMaxHz;
})();

export const SIMULATION_CONFIG = {
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL ?? 'mqtt://test.mosquitto.org:1883',
  MQTT_CLIENT_ID: process.env.MQTT_CLIENT_ID ?? `ventylab-server-${process.pid}-${Date.now()}`,
  MQTT_USERNAME: process.env.MQTT_USERNAME as string | undefined,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD as string | undefined,
  MQTT_TELEMETRY_TOPIC: process.env.MQTT_TELEMETRY_TOPIC ?? '/ventynet/data',
  MQTT_COMMAND_TOPIC: process.env.MQTT_COMMAND_TOPIC ?? '/ventynet/commands',
  MQTT_ALARM_TOPIC: process.env.MQTT_ALARM_TOPIC ?? '/ventynet/alarms',
  WS_MAX_HZ,
  WS_CORS_ORIGINS: (process.env.WS_CORS_ORIGINS ?? '').split(',').filter(Boolean),
} as const;
