/*
 * Funcionalidad: Orquestador de las pruebas de carga (npm run test:load)
 * Descripción: Contra el stack local ya levantado (docker-compose.yml + docker-compose.local.yml, perfil postgres, base sembrada con demo:seed) verifica /health/ready, siembra los datos de carga (grupo de 30 estudiantes y reserva activa), corre la carga HTTP con k6 en Docker y la de telemetría en dos fases (mqttx bench pub en Docker a ~60 msg/s y luego el publicador Node con sello de tiempo a 60 msg/s, ambas con 30 clientes Socket.io en la sala ventilator) y deja los resúmenes JSON en docs/perf/raw; se niega a correr contra un backend, broker o base que no sean locales y no se ejecuta en verify ni en CI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { measureLatency } from "./telemetry/measure-latency.mjs";
import { isLoopbackUrl, option, parseArgs, sleep } from "./telemetry/lib.mjs";

export const K6_IMAGE = "grafana/k6:1.3.0";
export const MQTTX_IMAGE = "emqx/mqttx-cli:v1.12.1";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOAD_DIR = join(ROOT, "scripts", "load");
const COMPOSE_ENV = join(ROOT, "deploy", "local", "compose.env");
const MQTTX_CONTAINER = "ventylab-load-mqttx";

const USAGE = `Usage: node scripts/load/run-load.mjs [all|http|telemetry] [options]

Runs against an already running LOCAL stack (see docs/perf/README.md); never in CI.

  --backend-url <url>      Default http://127.0.0.1:4000 (must be local)
  --broker-url <url>       Default mqtt://127.0.0.1:<MQTT_PUBLIC_PORT or 1883> (LOAD_BROKER_URL; must be local)
  --network <name>         Docker network of the stack (default ventylab-local_internal)
  --out-dir <dir>          Default docs/perf/raw
  --skip-seed              Do not run scripts/load/seed-load-data.ts
  --http-duration <k6>     Default 3m
  --student-vus <n>        Default 30
  --teacher-vus <n>        Default 2
  --telemetry-duration <s> Measurement window per telemetry phase (default 300)
  --clients <n>            Socket.io clients (default 30)
  --rate <hz>              Publish rate (default 60)
  --skip-mqttx / --skip-node  Skip one telemetry phase`;

function readComposeEnv() {
  const values = {};

  for (const line of readFileSync(COMPOSE_ENV, "utf8").split(/\r?\n/u)) {
    const match = /^([A-Z0-9_]+)=(.*)$/u.exec(line.trim());

    if (match) {
      values[match[1]] = match[2];
    }
  }

  return values;
}

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, { stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit", encoding: "utf8", shell: options.shell ?? false, env: { ...process.env, ...options.env } });

  if (result.error) {
    throw result.error;
  }

  if (!options.allowedCodes?.includes(result.status) && result.status !== 0) {
    throw new Error(`${command} exited with ${result.status}`);
  }

  return result;
}

async function assertReady(backendUrl) {
  const response = await fetch(new URL("/health/ready", backendUrl)).catch((error) => ({ ok: false, status: error.message }));

  if (!response.ok) {
    throw new Error(`${backendUrl}/health/ready is not ready (${response.status}); start the local stack first (docs/perf/README.md)`);
  }

  console.log(`[load] ${backendUrl}/health/ready -> ${response.status}`);
}

function dockerStats(label, outDir) {
  const result = spawnSync("docker", ["stats", "--no-stream", "--format", "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"], { encoding: "utf8" });
  const text = `${label}\n${result.stdout ?? ""}`;

  writeFileSync(join(outDir, `docker-stats-${label}.txt`), text);
  console.log(text);
}

function seedLoadData(env) {
  const databaseUrl = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@127.0.0.1:${env.LOCAL_POSTGRES_PORT ?? "55432"}/${env.POSTGRES_DB}`;
  const result = run("npx", ["tsx", "scripts/load/seed-load-data.ts"], { capture: true, shell: process.platform === "win32", env: { LOAD_DATABASE_URL: databaseUrl } });
  const lines = result.stdout.trim().split(/\r?\n/u);

  console.log(lines.slice(0, -1).join("\n"));

  return JSON.parse(lines[lines.length - 1]);
}

function runHttp(fixture, args, network, outDir) {
  const k6Args = [
    "run", "--rm", "--network", network,
    "-v", `${join(LOAD_DIR, "k6")}:/scripts:ro`,
    "-v", `${outDir}:/out`,
    K6_IMAGE, "run", "--quiet",
    "-e", "BASE_URL=http://backend:4000",
    "-e", `GROUP_ID=${fixture.groupId}`,
    "-e", `STUDENT_EMAILS=${fixture.studentEmails.join(",")}`,
    "-e", `LOAD_PASSWORD=${fixture.password}`,
    "-e", `DURATION=${option(args, "http-duration", undefined, "3m")}`,
    "-e", `STUDENT_VUS=${option(args, "student-vus", undefined, 30)}`,
    "-e", `TEACHER_VUS=${option(args, "teacher-vus", undefined, 2)}`,
    "-e", "SUMMARY_PATH=/out/http-summary.json",
    "/scripts/http-load.js",
  ];

  // 99 = some threshold crossed; the summary is still written and reported.
  run("docker", k6Args, { allowedCodes: [99] });
}

async function telemetryPhase({ name, publisher, measureArgs, outDir }) {
  console.log(`[load] telemetry phase "${name}"`);

  let markReady;
  const ready = new Promise((resolveReady) => {
    markReady = resolveReady;
  });
  const measuring = measureLatency([...measureArgs, "--label", name, "--out", join(outDir, `telemetry-${name}.json`)], { onReady: markReady });

  await Promise.race([ready, measuring]);

  const publisherResult = await publisher();
  const result = await measuring;

  dockerStats(`telemetry-${name}`, outDir);

  return { result, publisherResult };
}

function startMqttxBench({ network, env, rate, seconds, outDir }) {
  const intervalMs = Math.round(1000 / rate);
  const payload = JSON.stringify({ pressure: 18.5, flow: 32.1, volume: 420, mode: "MQTTXBENCH", settings: { peep: 5, fio2: 0.4 } });

  spawnSync("docker", ["rm", "-f", MQTTX_CONTAINER], { stdio: "ignore" });

  const child = spawn("docker", [
    "run", "--rm", "--name", MQTTX_CONTAINER, "--network", network, MQTTX_IMAGE,
    "mqttx", "bench", "pub",
    "-h", "mosquitto", "-p", "1883",
    "-u", env.MQTT_DEVICE_USERNAME ?? "ventylab-device", "-P", env.MQTT_DEVICE_PASSWORD,
    "-t", "/ventynet/data", "-q", "0",
    "-c", "1", "-im", String(intervalMs), "-L", String(Math.ceil((seconds * 1000) / intervalMs)), "-v",
    "-m", payload,
  ], { stdio: ["ignore", "pipe", "pipe"] });

  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  return new Promise((resolveRun) => {
    setTimeout(() => {
      spawnSync("docker", ["stop", "-t", "2", MQTTX_CONTAINER], { stdio: "ignore" });
    }, (seconds + 20) * 1000);
    child.on("close", (code) => {
      writeFileSync(join(outDir, "mqttx-bench-output.txt"), output);
      resolveRun({ image: MQTTX_IMAGE, intervalMs, nominalRate: Math.round((1000 / intervalMs) * 100) / 100, seconds, exitCode: code });
    });
  });
}

async function runTelemetry(fixture, args, env, network, outDir) {
  const backendUrl = option(args, "backend-url", undefined, "http://127.0.0.1:4000");
  const brokerUrl = option(args, "broker-url", "LOAD_BROKER_URL", `mqtt://127.0.0.1:${process.env.MQTT_PUBLIC_PORT ?? "1883"}`);
  const durationS = Number(option(args, "telemetry-duration", undefined, 300));
  const warmupS = 5;
  const rate = Number(option(args, "rate", undefined, 60));
  const common = [
    "--backend-url", backendUrl,
    "--clients", String(option(args, "clients", undefined, 30)),
    "--duration", String(durationS),
    "--warmup", String(warmupS),
    "--emails", fixture.studentEmails.join(","),
    "--password", fixture.password,
    "--metrics-email", env.SUPERADMIN_EMAIL,
    "--reset-metrics",
    "--broker-url", brokerUrl,
    "--mqtt-username", env.MQTT_BACKEND_USERNAME ?? "ventylab-backend",
    "--mqtt-password", env.MQTT_BACKEND_PASSWORD,
  ];
  const phases = {};

  if (!args["skip-mqttx"]) {
    phases.mqttx = await telemetryPhase({
      name: "mqttx",
      outDir,
      measureArgs: [...common, "--marker", "MQTTXBENCH"],
      publisher: async () => {
        return startMqttxBench({ network, env, rate, seconds: durationS + warmupS + 10, outDir });
      },
    });
    await sleep(5_000);
  }

  if (!args["skip-node"]) {
    phases.node = await telemetryPhase({
      name: "node",
      outDir,
      measureArgs: [...common, "--marker", "LOADTEST"],
      publisher: async () => {
        const { publishTelemetry } = await import("./telemetry/publish-telemetry.mjs");

        return publishTelemetry([
          "--broker-url", brokerUrl,
          "--username", env.MQTT_DEVICE_USERNAME ?? "ventylab-device",
          "--password", env.MQTT_DEVICE_PASSWORD,
          "--rate", String(rate),
          "--duration", String(durationS + warmupS + 5),
          "--marker", "LOADTEST",
        ]);
      },
    });
  }

  for (const [name, phase] of Object.entries(phases)) {
    writeFileSync(join(outDir, `telemetry-${name}-publisher.json`), `${JSON.stringify(phase.publisherResult, null, 2)}\n`);
  }

  return phases;
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--help")) {
    console.log(USAGE);

    return;
  }

  const mode = ["all", "http", "telemetry"].find((candidate) => argv[0] === candidate) ?? "all";
  const args = parseArgs(argv);
  const backendUrl = option(args, "backend-url", undefined, "http://127.0.0.1:4000");
  const brokerUrl = option(args, "broker-url", "LOAD_BROKER_URL", `mqtt://127.0.0.1:${process.env.MQTT_PUBLIC_PORT ?? "1883"}`);
  const network = option(args, "network", undefined, "ventylab-local_internal");
  const outDir = resolve(ROOT, option(args, "out-dir", undefined, join("docs", "perf", "raw")));

  if (!isLoopbackUrl(backendUrl) || !isLoopbackUrl(brokerUrl)) {
    throw new Error("run-load.mjs only targets the local stack (127.0.0.1/localhost); use telemetry/measure-latency.mjs (listen-only) for the VPS");
  }

  mkdirSync(outDir, { recursive: true });
  await assertReady(backendUrl);
  run("docker", ["network", "inspect", "--format", "{{.Name}}", network]);

  const env = readComposeEnv();
  const fixture = args["skip-seed"] ? JSON.parse(readFileSync(join(outDir, "load-fixture.json"), "utf8")) : seedLoadData(env);

  writeFileSync(join(outDir, "load-fixture.json"), `${JSON.stringify({ ...fixture, password: undefined }, null, 2)}\n`);
  fixture.password ??= "VentyLab-Demo-2026";

  if (mode === "all" || mode === "http") {
    runHttp(fixture, args, network, outDir);
    dockerStats("http", outDir);
  }

  if (mode === "all" || mode === "telemetry") {
    const phases = await runTelemetry(fixture, args, env, network, outDir);

    for (const [name, phase] of Object.entries(phases)) {
      console.log(`[load] ${name}: ${JSON.stringify({ publisher: phase.publisherResult, latencyMs: phase.result.latencyMs, framesPerClient: phase.result.framesPerClient, joinRejected: phase.result.joinRejected })}`);
    }
  }

  console.log(`[load] results in ${outDir}`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
