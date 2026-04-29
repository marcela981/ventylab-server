/*
 * Funcionalidad: simulate-ventilator
 * Descripción: Script de prueba que publica telemetría sintética en MQTT a 30 Hz,
 *              simulando el hardware del ventilador con ondas senoidales.
 *              Permite probar el pipeline MQTT→Backend→WebSocket sin hardware real.
 *              No forma parte del build de producción.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria
 *        que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import { connect } from 'mqtt';
import * as dotenv from 'dotenv';

// Load env from .env.development by default
dotenv.config({ path: '.env.development' });
dotenv.config(); // fallback

const BROKER_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://test.mosquitto.org:1883';
const TOPIC = process.env.MQTT_TELEMETRY_TOPIC ?? '/ventynet/data';
const DEVICE_ID = 'ventilab-sim-local';
const PUBLISH_INTERVAL_MS = 33; // ~30 Hz

// Respiratory cycle: 4 s → 0.25 Hz
const BREATH_FREQ_HZ = 0.25;
const TWO_PI = 2 * Math.PI;

console.log(`[SimVent] Connecting to ${BROKER_URL}`);
console.log(`[SimVent] Publishing to topic: ${TOPIC} at ~30 Hz`);

const client = connect(BROKER_URL, {
  clientId: `ventylab-sim-local-${process.pid}`,
  clean: true,
  connectTimeout: 10_000,
  reconnectPeriod: 3_000,
});

client.on('connect', () => {
  console.log('[SimVent] Connected. Publishing synthetic ventilator data...');
  console.log('[SimVent] Press Ctrl+C to stop.\n');

  const startMs = Date.now();

  const interval = setInterval(() => {
    const elapsedSec = (Date.now() - startMs) / 1000;
    const phase = TWO_PI * BREATH_FREQ_HZ * elapsedSec;

    // Inspiratory phase: 0→π (pressure rises, volume fills)
    // Expiratory phase:  π→2π (pressure drops, flow reverses)
    const breathPhase = phase % TWO_PI;
    const inspFraction = breathPhase < Math.PI ? breathPhase / Math.PI : 0;

    // Pressure: 5–25 cmH2O — peaks at mid-inspiration
    const pressure = 5 + 20 * Math.max(0, Math.sin(breathPhase));

    // Flow: −60 to +60 L/min — positive during inspiration, negative during expiration
    const flow = 60 * Math.sin(breathPhase);

    // Volume: 0–500 ml — accumulates during inspiration, returns to 0 at end of expiration
    const volume = 500 * Math.max(0, inspFraction);

    const payload = JSON.stringify({
      pressure: +pressure.toFixed(2),
      flow: +flow.toFixed(2),
      volume: +volume.toFixed(1),
      timestamp: Date.now(),
      deviceId: DEVICE_ID,
    });

    client.publish(TOPIC, payload, { qos: 0, retain: false }, (err) => {
      if (err) {
        console.error('[SimVent] Publish error:', err.message);
      }
    });
  }, PUBLISH_INTERVAL_MS);

  process.on('SIGINT', () => {
    console.log('\n[SimVent] Stopping...');
    clearInterval(interval);
    client.end(true, {}, () => {
      console.log('[SimVent] Disconnected.');
      process.exit(0);
    });
  });
});

client.on('error', (err) => {
  console.error('[SimVent] MQTT error:', err.message);
});

client.on('reconnect', () => {
  console.log('[SimVent] Reconnecting...');
});
