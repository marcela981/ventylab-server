/*
 * Funcionalidad: simulate-ventilator
 * Descripción: Script de prueba que publica telemetría sintética en MQTT simulando el hardware del ventilador.
 *              Permite probar el pipeline MQTT→Backend→WebSocket sin hardware real. No forma parte del build
 *              de producción. v1.2: ya no carga .env ni .env.development; la configuración llega solo por
 *              banderas o variables SIM_*; por defecto usa el broker del stack local (docker-compose.local.yml)
 *              con las credenciales del dispositivo de deploy/local/compose.env; rechaza brokers fuera de esta
 *              máquina salvo --allow-remote-test-broker y SIEMPRE los brokers públicos; respiraciones
 *              fisiológicas (VCV con flujo constante y espiración pasiva) para que la detección de ciclos calcule
 *              Ppico/PEEP; --shape real publica exactamente la trama del equipo físico
 *              {pressure, flow, volume, timestamp=uptime ms} con marca de tiempo no monótona opcional (saltos
 *              atrás, reinicios, jitter) y ráfagas; --pause simula un corte; imprime mensajes publicados por segundo.
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import { connect } from 'mqtt';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { brokerRefusal, defaultLocalBrokerUrl, resolveCredentials } from './audit-e2e/local-broker';

const USAGE = `Usage: npx tsx scripts/simulate-ventilator.ts [options]

Publishes synthetic ventilator telemetry. Defaults to the LOCAL stack broker; never use the lab broker.

  --broker <url>                 SIM_BROKER_URL, default mqtt://127.0.0.1:<MQTT_PUBLIC_PORT or 1883>
  --username <u> --password <p>  SIM_MQTT_USERNAME / SIM_MQTT_PASSWORD; default on a local broker: the
                                 device user of deploy/local/compose.env
  --allow-remote-test-broker     Allow a broker outside this machine (public brokers are always refused)
  --topic <topic>                SIM_TOPIC, default /ventynet/data
  --shape legacy|real            legacy (default): {pressure, flow, volume, timestamp=epoch ms, deviceId}
                                 real: exactly {pressure, flow, volume, timestamp=device uptime ms}
  --rate <hz>                    Messages per second (default 30 legacy, 50 real)
  --burst <n>                    Publish frames in groups of n back-to-back (same ms), default 1
  --jitter <ms>                  real: random +/- ms added to each timestamp (duplicates, small reorders)
  --ts-backjump <p>              real: per-frame probability that the uptime counter jumps back 100-1000 ms
  --ts-reset-every <s>           real: the uptime counter restarts every s seconds (device reboot)
  --pause <startS>:<durationS>   Publish nothing during that window (e.g. 10:5 for a 5 s outage)
  --duration <s>                 Stop after s seconds (default: until Ctrl+C)`;

const SERVER_ROOT = path.resolve(__dirname, '..');

// One breath: VCV with constant inspiratory flow and passive exponential expiration (single-compartment lung).
const BREATH_PERIOD_S = 4; // 15 breaths/min
const INSPIRATORY_TIME_S = 1;
const PEEP_CMH2O = 5;
const TIDAL_VOLUME_ML = 500;
const RESISTANCE_CMH2O_L_S = 10;
const COMPLIANCE_ML_CMH2O = 50;
const TAU_S = (RESISTANCE_CMH2O_L_S * COMPLIANCE_ML_CMH2O) / 1000;
const UPTIME_START_MS = 1_000;
const TICK_MS = 2;

interface Sample { pressure: number; flow: number; volume: number }

function breathSample(tSec: number): Sample {
  const t = tSec % BREATH_PERIOD_S;
  let volumeMl: number;
  let flowMlS: number;
  let pressure: number;

  if (t < INSPIRATORY_TIME_S) {
    flowMlS = TIDAL_VOLUME_ML / INSPIRATORY_TIME_S;
    volumeMl = flowMlS * t;
    pressure = PEEP_CMH2O + (RESISTANCE_CMH2O_L_S * flowMlS) / 1000 + volumeMl / COMPLIANCE_ML_CMH2O;
  } else {
    // Airway pressure = alveolar pressure - resistive drop, which equals PEEP for a passive exhalation.
    volumeMl = TIDAL_VOLUME_ML * Math.exp(-(t - INSPIRATORY_TIME_S) / TAU_S);
    flowMlS = -volumeMl / TAU_S;
    pressure = PEEP_CMH2O;
  }

  const noise = () => (Math.random() - 0.5) * 0.2;

  return {
    pressure: +(pressure + noise()).toFixed(2),
    flow: +((flowMlS * 60) / 1000 + noise()).toFixed(2), // L/min
    volume: +volumeMl.toFixed(1),
  };
}

function parsePause(raw: string | undefined): { startS: number; endS: number } | null {
  if (raw === undefined) return null;
  const [start, duration] = raw.split(':').map(Number);
  if (!(start >= 0) || !(duration > 0)) throw new Error(`invalid --pause "${raw}" (expected <startSec>:<durationSec>)`);
  return { startS: start, endS: start + duration };
}

function positive(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!(value > 0)) throw new Error(`invalid --${name} "${raw}"`);
  return value;
}

function fail(message: string): never {
  console.error(`[SimVent] ${message}`);
  process.exit(1);
}

let args: ReturnType<typeof readArgs>;

function readArgs() {
  return parseArgs({
    options: {
      broker: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string' },
      'allow-remote-test-broker': { type: 'boolean', default: false },
      topic: { type: 'string' },
      shape: { type: 'string', default: 'legacy' },
      rate: { type: 'string' },
      burst: { type: 'string' },
      jitter: { type: 'string' },
      'ts-backjump': { type: 'string' },
      'ts-reset-every': { type: 'string' },
      pause: { type: 'string' },
      duration: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  }).values;
}

try {
  args = readArgs();
} catch (err) {
  console.error(USAGE);
  fail((err as Error).message);
}

if (args.help) {
  console.log(USAGE);
  process.exit(0);
}

const brokerUrl = args.broker ?? process.env.SIM_BROKER_URL ?? defaultLocalBrokerUrl();
const refusal = brokerRefusal(brokerUrl, args['allow-remote-test-broker']);
if (refusal) fail(`${refusal} Nothing was published.`);

const topic = args.topic ?? process.env.SIM_TOPIC ?? '/ventynet/data';
if (/command|ack/iu.test(topic)) fail(`refusing to publish telemetry on ${topic}: command and ack topics are not allowed.`);

const shape = args.shape;
if (shape !== 'legacy' && shape !== 'real') fail(`invalid --shape "${shape}" (legacy|real)`);

let rateHz: number, burst: number, jitterMs: number, backjumpProbability: number, resetEveryS: number;
let durationS: number, pause: { startS: number; endS: number } | null;
try {
  rateHz = positive(args.rate, 'rate', shape === 'real' ? 50 : 30);
  burst = Math.round(positive(args.burst, 'burst', 1));
  jitterMs = positive(args.jitter, 'jitter', 0);
  backjumpProbability = positive(args['ts-backjump'], 'ts-backjump', 0);
  resetEveryS = positive(args['ts-reset-every'], 'ts-reset-every', 0);
  durationS = positive(args.duration, 'duration', Infinity);
  pause = parsePause(args.pause);
} catch (err) {
  fail((err as Error).message);
}

let uptimeOffsetMs = 0;

/** Device uptime counter (millis()) with the requested non-monotonic behaviour. */
function deviceUptimeMs(sampleMs: number): number {
  if (backjumpProbability > 0 && Math.random() < backjumpProbability) {
    uptimeOffsetMs -= 100 + Math.random() * 900;
  }
  const base = resetEveryS > 0 ? sampleMs % (resetEveryS * 1000) : sampleMs;
  const jitter = jitterMs > 0 ? (Math.random() * 2 - 1) * jitterMs : 0;
  return Math.max(0, Math.round(UPTIME_START_MS + base + uptimeOffsetMs + jitter));
}

function buildPayload(sampleS: number): string {
  const sample = breathSample(sampleS);
  if (shape === 'real') {
    return JSON.stringify({ ...sample, timestamp: deviceUptimeMs(sampleS * 1000) });
  }
  return JSON.stringify({ ...sample, timestamp: Date.now(), deviceId: 'ventilab-sim-local' });
}

const credentials = resolveCredentials(
  brokerUrl,
  { username: args.username ?? process.env.SIM_MQTT_USERNAME, password: args.password ?? process.env.SIM_MQTT_PASSWORD },
  SERVER_ROOT,
);

console.log(`[SimVent] Broker ${new URL(brokerUrl).host}${credentials.username ? ` as ${credentials.username}` : ' (anonymous)'}`);
console.log(`[SimVent] Topic ${topic}, shape ${shape}, ${rateHz} Hz, burst ${burst}${pause ? `, pause ${pause.startS}-${pause.endS} s` : ''}`);

const client = connect(brokerUrl, {
  ...credentials,
  clientId: `ventylab-sim-local-${process.pid}`,
  clean: true,
  connectTimeout: 10_000,
  reconnectPeriod: 3_000,
  queueQoSZero: false, // frames published while offline are lost, as on the real device
});

const totals = { published: 0, paused: 0, offline: 0, errors: 0 };
let timer: NodeJS.Timeout | null = null;

function stop(reason: string): void {
  if (timer) clearInterval(timer);
  console.log(`\n[SimVent] Stopping (${reason}). published=${totals.published} skippedByPause=${totals.paused} droppedOffline=${totals.offline} publishErrors=${totals.errors}`);
  client.end(true, {}, () => process.exit(0));
}

function startPublishing(): void {
  const frameMs = 1000 / rateHz;
  const startedAt = performance.now();
  const pending: string[] = [];
  let generated = 0;
  let paused = false;
  let second = 0;
  let publishedThisSecond = 0;

  timer = setInterval(() => {
    const elapsedMs = performance.now() - startedAt;
    if (elapsedMs >= durationS * 1000) return stop('duration reached');

    const elapsedS = elapsedMs / 1000;
    const nowPaused = pause !== null && elapsedS >= pause.startS && elapsedS < pause.endS;
    if (nowPaused !== paused) {
      paused = nowPaused;
      pending.length = 0;
      console.log(`[SimVent] ${paused ? 'PAUSED (simulated outage)' : 'publishing again'} at ${elapsedS.toFixed(2)} s`);
    }

    while (generated < Math.floor(elapsedMs / frameMs)) {
      generated++;
      if (paused) {
        totals.paused++;
        continue;
      }
      pending.push(buildPayload((generated * frameMs) / 1000));
    }

    if (pending.length >= burst) {
      for (const payload of pending.splice(0)) {
        if (!client.connected) {
          totals.offline++;
          continue;
        }
        client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
          if (err) totals.errors++;
        });
        totals.published++;
        publishedThisSecond++;
      }
    }

    if (Math.floor(elapsedS) > second) {
      console.log(`[SimVent] second ${second}: ${publishedThisSecond} published`);
      second = Math.floor(elapsedS);
      publishedThisSecond = 0;
    }
  }, TICK_MS);
}

client.on('connect', () => {
  console.log('[SimVent] Connected. Press Ctrl+C to stop.');
  if (!timer) startPublishing();
});

client.on('error', (err) => console.error('[SimVent] MQTT error:', err.message));
client.on('reconnect', () => console.log('[SimVent] Reconnecting...'));

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
