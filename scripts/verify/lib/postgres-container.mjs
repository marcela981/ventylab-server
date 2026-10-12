/*
 * Funcionalidad: Contenedor PostgreSQL desechable
 * Descripción: Arranca un contenedor postgres:17-alpine con nombre único en un puerto libre de 127.0.0.1, espera a que acepte conexiones TCP, crea bases de datos adicionales, ejecuta consultas con psql dentro del contenedor y lo elimina siempre, también ante SIGINT o SIGTERM
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomBytes } from "node:crypto";

import { run, sleep } from "./process.mjs";

export const CONTAINER_PREFIX = "ventylab-verify-";

const IMAGE = "postgres:17-alpine";
const USER = "verify";
const PASSWORD = "verify";
const MAIN_DATABASE = "verify";
const READY_TIMEOUT_MS = 90_000;

const liveContainers = new Set();

async function docker(args, options = {}) {
  return run("docker", args, options);
}

async function removeAll() {
  await Promise.all([...liveContainers].map((name) => docker(["rm", "-f", "-v", name])));
  liveContainers.clear();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void removeAll().finally(() => process.exit(130));
  });
}

export async function startPostgres(purpose) {
  const name = `${CONTAINER_PREFIX}${purpose}-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const started = await docker([
    "run", "-d", "--name", name,
    "-e", `POSTGRES_USER=${USER}`, "-e", `POSTGRES_PASSWORD=${PASSWORD}`, "-e", `POSTGRES_DB=${MAIN_DATABASE}`,
    "-p", "127.0.0.1::5432", IMAGE,
  ]);

  if (started.code !== 0) {
    throw new Error(`docker run failed (is Docker running?):\n${started.output}`);
  }

  liveContainers.add(name);

  const portLookup = await docker(["port", name, "5432/tcp"]);
  const port = portLookup.output.match(/:(\d+)\s*$/m)?.[1];

  if (portLookup.code !== 0 || !port) {
    throw new Error(`Could not read the published port of ${name}:\n${portLookup.output}`);
  }

  const container = {
    name,
    port: Number(port),
    url: (database = MAIN_DATABASE) => `postgresql://${USER}:${PASSWORD}@127.0.0.1:${port}/${database}?schema=public`,
    psql: (sql, database = MAIN_DATABASE) => docker(["exec", name, "psql", "-h", "127.0.0.1", "-U", USER, "-d", database, "-v", "ON_ERROR_STOP=1", "-tAc", sql]),
    createDatabase: async (database) => {
      const created = await container.psql(`CREATE DATABASE "${database}"`);

      if (created.code !== 0) {
        throw new Error(`CREATE DATABASE ${database} failed:\n${created.output}`);
      }
    },
    remove: async () => {
      await docker(["rm", "-f", "-v", name]);
      liveContainers.delete(name);
    },
  };

  await waitUntilReady(container);

  return container;
}

// The image's init phase runs a temporary server on the Unix socket only, so a TCP probe is ready only once the final server listens.
async function waitUntilReady(container) {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const probe = await container.psql("SELECT 1");

    if (probe.code === 0 && probe.output.trim() === "1") {
      return;
    }

    await sleep(500);
  }

  throw new Error(`PostgreSQL in ${container.name} was not ready after ${READY_TIMEOUT_MS} ms`);
}
