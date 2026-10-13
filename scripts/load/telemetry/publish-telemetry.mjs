/*
 * Funcionalidad: Publicador sintético de telemetría con sello de tiempo (solo broker local)
 * Descripción: Publica tramas JSON de telemetría (seq, presión, flujo y volumen sintéticos, deviceTs = Date.now() del momento de publicar, mode = marcador de la prueba) a una tasa fija con programación corregida por deriva, durante una duración dada; se niega a correr si el broker no es 127.0.0.1/localhost o si el tópico es de comandos, de modo que nunca puede alcanzar el broker del VPS ni el ventilador real
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import mqtt from "mqtt";

import { isLoopbackUrl, option, parseArgs } from "./lib.mjs";

const USAGE = `Usage: node scripts/load/telemetry/publish-telemetry.mjs --broker-url mqtt://127.0.0.1:1883 [options]

Local broker only (127.0.0.1/localhost). Never point it at the VPS or at the physical ventilator.

  --broker-url <url>   Local broker (LOAD_BROKER_URL, default mqtt://127.0.0.1:1883)
  --username/--password  Publisher credentials (LOAD_PUB_USERNAME / LOAD_PUB_PASSWORD)
  --topic <topic>      Telemetry topic (LOAD_TOPIC, default /ventynet/data)
  --rate <hz>          Messages per second (default 60)
  --duration <s>       Seconds to publish (default 310)
  --marker <mode>      Value of the frame "mode" field (default LOADTEST)`;

export async function publishTelemetry(rawArgs) {
  const args = parseArgs(rawArgs);
  const brokerUrl = option(args, "broker-url", "LOAD_BROKER_URL", "mqtt://127.0.0.1:1883");
  const topic = option(args, "topic", "LOAD_TOPIC", "/ventynet/data");
  const rate = Number(option(args, "rate", "LOAD_RATE", 60));
  const durationS = Number(option(args, "duration", "LOAD_PUBLISH_DURATION", 310));
  const marker = option(args, "marker", "LOAD_MARKER", "LOADTEST");

  if (!isLoopbackUrl(brokerUrl)) {
    throw new Error(`Refusing to publish: ${brokerUrl} is not a local broker (127.0.0.1/localhost only)`);
  }

  if (/command|ack/iu.test(topic)) {
    throw new Error(`Refusing to publish on ${topic}: only telemetry topics are allowed`);
  }

  if (!(rate > 0 && rate <= 1000) || !(durationS > 0)) {
    throw new Error(`Invalid --rate or --duration\n\n${USAGE}`);
  }

  const client = await new Promise((resolve, reject) => {
    const connection = mqtt.connect(brokerUrl, {
      username: option(args, "username", "LOAD_PUB_USERNAME", undefined),
      password: option(args, "password", "LOAD_PUB_PASSWORD", undefined),
      clientId: `ventylab-load-publisher-${process.pid}`,
      reconnectPeriod: 0,
      connectTimeout: 10_000,
    });

    connection.once("connect", () => resolve(connection));
    connection.once("error", reject);
  });

  const periodMs = 1000 / rate;
  const startedAt = performance.now();
  const endAt = startedAt + durationS * 1000;
  let seq = 0;

  await new Promise((resolve) => {
    const tick = () => {
      const now = performance.now();

      while (startedAt + seq * periodMs <= now && now < endAt) {
        const phase = (seq % rate) / rate;
        const inspiring = phase < 0.33;
        const frame = {
          seq,
          pressure: Math.round((inspiring ? 5 + 15 * Math.sin((Math.PI * phase) / 0.33) : 5) * 10) / 10,
          flow: Math.round((inspiring ? 40 : -30 * (1 - (phase - 0.33) / 0.67)) * 10) / 10,
          volume: Math.round(inspiring ? 450 * (phase / 0.33) : 450 * (1 - (phase - 0.33) / 0.67)),
          deviceTs: Date.now(),
          mode: marker,
          settings: { peep: 5, fio2: 0.4 },
        };

        client.publish(topic, JSON.stringify(frame), { qos: 0 });
        seq++;
      }

      if (now >= endAt) {
        resolve();

        return;
      }

      setTimeout(tick, Math.max(0, startedAt + seq * periodMs - performance.now()));
    };

    tick();
  });

  const elapsedS = (performance.now() - startedAt) / 1000;

  await new Promise((resolve) => client.end(false, {}, resolve));

  return { published: seq, elapsedS: Math.round(elapsedS * 100) / 100, effectiveRate: Math.round((seq / elapsedS) * 100) / 100, topic, marker };
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/gu, "/").split("/").pop());

if (invokedDirectly) {
  if (process.argv.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  publishTelemetry(process.argv.slice(2))
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
