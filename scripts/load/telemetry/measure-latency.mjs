/*
 * Funcionalidad: Medición de latencia de telemetría (solo escucha)
 * Descripción: Conecta N clientes Socket.io autenticados por JWT al backend, pide entrar a la sala ventilator y registra cada lote ventilator:telemetry; calcula la latencia extremo a extremo con el deviceTs de cada trama, la latencia relativa al broker (si se suscribe al tópico MQTT con --broker-url, mismo reloj que los clientes), la de serverTs al cliente, la entrega por cliente y las métricas internas del servidor (GET /api/ventilator/telemetry/metrics). Nunca publica en MQTT ni envía comandos al ventilador, por lo que sirve también contra el VPS y el ventilador real; reiniciar las métricas del servidor solo se permite contra un backend local
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import mqtt from "mqtt";
import { io } from "socket.io-client";

import { isLoopbackUrl, login, option, parseArgs, sleep, summarize, unwrapEnvelope } from "./lib.mjs";

const USAGE = `Usage: node scripts/load/telemetry/measure-latency.mjs [options]

Listen-only: this script never publishes MQTT messages and never sends ventilator commands.

  --backend-url <url>        Backend base URL (LOAD_BACKEND_URL, default http://127.0.0.1:4000)
  --token <jwt>              Access token used by every client (LOAD_TOKEN), or:
  --emails <a,b,...|@file>   Accounts to sign in, one per client in turn (LOAD_EMAILS)
  --password <pw>            Password of those accounts (LOAD_PASSWORD)
  --clients <n>              Socket.io clients (default 30)
  --duration <s>             Measurement window in seconds (default 300)
  --warmup <s>               Seconds ignored after the clients join (default 5)
  --marker <mode>            Only count frames whose mode equals this value (LOAD_MARKER)
  --broker-url <url>         Also subscribe to the telemetry topic for broker-relative latency (LOAD_BROKER_URL)
  --mqtt-username/--mqtt-password  Read-only subscriber credentials (LOAD_MQTT_USERNAME / LOAD_MQTT_PASSWORD)
  --topic <topic>            Telemetry topic (LOAD_TOPIC, default /ventynet/data)
  --metrics-token <jwt>      ADMIN token to read the server metrics (LOAD_METRICS_TOKEN), or
  --metrics-email <email>    ADMIN account to sign in for the metrics (password: --password)
  --reset-metrics            Reset the server metrics first (local backend only)
  --label <text>             Name stored in the result
  --out <file.json>          Write the full result as JSON`;

const KEY_TTL_MS = 15_000;

function readEmails(raw) {
  if (!raw) {
    return [];
  }

  const text = raw.startsWith("@") ? readFileSync(raw.slice(1), "utf8") : raw;

  return text.split(/[\s,]+/u).map((email) => email.trim()).filter((email) => email.length > 0);
}

function frameKey(frame) {
  if (Number.isInteger(frame.seq)) {
    return `s${frame.seq}`;
  }

  return Number.isFinite(frame.deviceTs) ? `t${frame.deviceTs}` : undefined;
}

async function fetchMetrics(backendUrl, token) {
  const response = await fetch(new URL("/api/ventilator/telemetry/metrics", backendUrl), { headers: { authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`GET /api/ventilator/telemetry/metrics answered ${response.status}`);
  }

  return unwrapEnvelope(body);
}

async function resetMetrics(backendUrl, token) {
  const response = await fetch(new URL("/api/ventilator/telemetry/metrics/reset", backendUrl), { method: "POST", headers: { authorization: `Bearer ${token}` } });

  if (!response.ok) {
    throw new Error(`POST /api/ventilator/telemetry/metrics/reset answered ${response.status}`);
  }
}

function connectClient(backendUrl, token, index) {
  return new Promise((resolve, reject) => {
    const socket = io(backendUrl, { transports: ["websocket"], auth: { token }, reconnection: false, timeout: 10_000 });
    const timer = setTimeout(() => reject(new Error(`client ${index}: no "authenticated" event within 10 s`)), 10_000);

    socket.once("authenticated", () => {
      clearTimeout(timer);
      socket.emit("ventilator:join", {});
      resolve(socket);
    });
    socket.once("auth_error", (payload) => {
      clearTimeout(timer);
      reject(new Error(`client ${index}: auth_error ${JSON.stringify(payload)}`));
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(new Error(`client ${index}: ${error.message}`));
    });
  });
}

function connectBroker(brokerUrl, username, password, topic, onMessage) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      clientId: `ventylab-latency-probe-${process.pid}-${Math.random().toString(16).slice(2, 8)}`,
      reconnectPeriod: 0,
      connectTimeout: 10_000,
    });

    client.once("connect", () => {
      client.subscribe(topic, { qos: 0 }, (error) => (error ? reject(error) : resolve(client)));
    });
    client.once("error", reject);
    client.on("message", onMessage);
  });
}

export async function measureLatency(rawArgs, hooks = {}) {
  const args = parseArgs(rawArgs);
  const backendUrl = option(args, "backend-url", "LOAD_BACKEND_URL", "http://127.0.0.1:4000");
  const clientCount = Number(option(args, "clients", "LOAD_CLIENTS", 30));
  const durationS = Number(option(args, "duration", "LOAD_DURATION", 300));
  const warmupS = Number(option(args, "warmup", "LOAD_WARMUP", 5));
  const marker = option(args, "marker", "LOAD_MARKER", undefined);
  const brokerUrl = option(args, "broker-url", "LOAD_BROKER_URL", undefined);
  const topic = option(args, "topic", "LOAD_TOPIC", "/ventynet/data");
  const password = option(args, "password", "LOAD_PASSWORD", undefined);
  const emails = readEmails(option(args, "emails", "LOAD_EMAILS", undefined));
  const sharedToken = option(args, "token", "LOAD_TOKEN", undefined);
  const localBackend = isLoopbackUrl(backendUrl);

  if (args.publish !== undefined) {
    throw new Error("measure-latency.mjs is listen-only and has no publish mode; use publish-telemetry.mjs against a local broker");
  }

  if (args["reset-metrics"] && !localBackend) {
    throw new Error("--reset-metrics is only allowed against a local backend (127.0.0.1/localhost)");
  }

  if (!sharedToken && (emails.length === 0 || !password)) {
    throw new Error(`Pass --token or --emails with --password\n\n${USAGE}`);
  }

  const tokens = [];

  for (let index = 0; index < clientCount; index++) {
    tokens.push(sharedToken ?? (await login(backendUrl, emails[index % emails.length], password, index)));
  }

  let metricsToken = option(args, "metrics-token", "LOAD_METRICS_TOKEN", undefined);
  const metricsEmail = option(args, "metrics-email", "LOAD_METRICS_EMAIL", undefined);

  if (!metricsToken && metricsEmail && password) {
    metricsToken = await login(backendUrl, metricsEmail, password, 250);
  }

  if (metricsToken && args["reset-metrics"]) {
    await resetMetrics(backendUrl, metricsToken);
  }

  const e2eSamples = [];
  const brokerRelativeSamples = [];
  const serverToClientSamples = [];
  const batchGapSamples = [];
  const brokerArrivals = new Map();
  const perClient = Array.from({ length: clientCount }, () => ({ frames: 0, batches: 0, lastBatchAt: undefined }));
  let brokerMessages = 0;
  let joinRejected = 0;
  let measuring = false;
  let broker;

  if (brokerUrl) {
    const username = option(args, "mqtt-username", "LOAD_MQTT_USERNAME", undefined);
    const mqttPassword = option(args, "mqtt-password", "LOAD_MQTT_PASSWORD", undefined);

    broker = await connectBroker(brokerUrl, username, mqttPassword, topic, (_topic, payload) => {
      const arrivedAt = Date.now();
      let parsed;

      try {
        parsed = JSON.parse(payload.toString("utf8"));
      } catch {
        return;
      }

      if (marker !== undefined && parsed.mode !== marker) {
        return;
      }

      const key = frameKey(parsed);

      if (measuring) {
        brokerMessages++;
      }

      if (key !== undefined) {
        brokerArrivals.set(key, arrivedAt);
      }
    });
  }

  const sockets = [];

  for (const [index, token] of tokens.entries()) {
    const socket = await connectClient(backendUrl, token, index);
    const stats = perClient[index];

    socket.on("ventilator:join-rejected", () => {
      joinRejected++;
    });
    socket.on("ventilator:telemetry", (batch) => {
      const receivedAt = Date.now();

      if (!measuring) {
        return;
      }

      if (stats.lastBatchAt !== undefined) {
        batchGapSamples.push(receivedAt - stats.lastBatchAt);
      }

      stats.lastBatchAt = receivedAt;
      stats.batches++;

      if (Number.isFinite(batch?.serverTs)) {
        serverToClientSamples.push(receivedAt - batch.serverTs);
      }

      for (const frame of batch?.frames ?? []) {
        if (marker !== undefined && frame.mode !== marker) {
          continue;
        }

        stats.frames++;

        if (Number.isFinite(frame.deviceTs)) {
          e2eSamples.push(receivedAt - frame.deviceTs);
        }

        const key = frameKey(frame);
        const brokerAt = key === undefined ? undefined : brokerArrivals.get(key);

        if (brokerAt !== undefined) {
          brokerRelativeSamples.push(receivedAt - brokerAt);
        }
      }
    });
    sockets.push(socket);
  }

  const pruneTimer = setInterval(() => {
    const limit = Date.now() - KEY_TTL_MS;

    for (const [key, at] of brokerArrivals) {
      if (at < limit) {
        brokerArrivals.delete(key);
      }
    }
  }, 5_000);

  console.log(`[measure] ${sockets.length} clients connected to ${backendUrl}; warm-up ${warmupS} s, measuring ${durationS} s`);
  hooks.onReady?.();
  await sleep(warmupS * 1000);
  measuring = true;

  const startedAt = new Date();

  await sleep(durationS * 1000);
  measuring = false;

  const endedAt = new Date();
  const serverMetrics = metricsToken ? await fetchMetrics(backendUrl, metricsToken).catch((error) => ({ error: error.message })) : undefined;

  clearInterval(pruneTimer);

  for (const socket of sockets) {
    socket.close();
  }

  broker?.end(true);

  const framesPerClient = perClient.map((stats) => stats.frames);
  const result = {
    label: option(args, "label", "LOAD_LABEL", "telemetry"),
    backendUrl,
    brokerUrl: brokerUrl ?? null,
    topic,
    marker: marker ?? null,
    clients: sockets.length,
    joinRejected,
    durationS,
    warmupS,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    brokerMessagesObserved: brokerUrl ? brokerMessages : null,
    framesPerClient: summarize(framesPerClient),
    totalFramesReceived: framesPerClient.reduce((sum, value) => sum + value, 0),
    latencyMs: {
      endToEndFromDeviceTs: summarize(e2eSamples),
      brokerRelative: summarize(brokerRelativeSamples),
      serverTsToClient: summarize(serverToClientSamples),
      interBatchGap: summarize(batchGapSamples),
    },
    serverMetrics: serverMetrics ?? null,
  };

  const out = option(args, "out", "LOAD_OUT", undefined);

  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  }

  return result;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/gu, "/").split("/").pop());

if (invokedDirectly) {
  if (process.argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  measureLatency(process.argv.slice(2))
    .then((result) => {
      console.log(JSON.stringify({ label: result.label, clients: result.clients, joinRejected: result.joinRejected, framesPerClient: result.framesPerClient, latencyMs: result.latencyMs }, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
