/*
 * Funcionalidad: Utilidades compartidas de las pruebas de carga de telemetría
 * Descripción: Lectura de argumentos --clave valor con respaldo en variables de entorno, detección de hosts locales (loopback o servicios del stack de docker-compose local), percentiles sobre muestras numéricas, inicio de sesión contra POST /api/auth/login (con X-Forwarded-For distinto por usuario solo contra un backend local, para no chocar con el limitador por IP) y lectura del sobre { success, data } del backend
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const next = argv[index + 1];

    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
    } else if (next !== undefined && !next.startsWith("--")) {
      args[rawKey] = next;
      index++;
    } else {
      args[rawKey] = true;
    }
  }

  return args;
}

export function option(args, key, envName, fallback) {
  if (args[key] !== undefined) {
    return args[key];
  }

  if (envName && process.env[envName] !== undefined && process.env[envName] !== "") {
    return process.env[envName];
  }

  return fallback;
}

export function hostOf(url) {
  return new URL(url).hostname.toLowerCase();
}

export function isLoopbackUrl(url) {
  return LOOPBACK_HOSTS.has(hostOf(url));
}

export function percentile(sorted, p) {
  if (sorted.length === 0) {
    return null;
  }

  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));

  return sorted[rank];
}

export function summarize(samples) {
  const sorted = Float64Array.from(samples).sort();
  const count = sorted.length;

  if (count === 0) {
    return { count: 0, min: null, mean: null, p50: null, p90: null, p95: null, p99: null, max: null };
  }

  let sum = 0;

  for (const value of sorted) {
    sum += value;
  }

  const round = (value) => (value === null ? null : Math.round(value * 100) / 100);

  return {
    count,
    min: round(sorted[0]),
    mean: round(sum / count),
    p50: round(percentile(sorted, 50)),
    p90: round(percentile(sorted, 90)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[count - 1]),
  };
}

export function unwrapEnvelope(body) {
  return body && typeof body === "object" && "data" in body ? body.data : body;
}

export async function login(backendUrl, email, password, index) {
  const headers = { "content-type": "application/json" };

  // The backend trusts one proxy hop (X-Forwarded-For) and throttles sign-in per client IP. Against a local stack each
  // simulated user gets its own documentation-range address, as real students behind the proxy would.
  if (isLoopbackUrl(backendUrl)) {
    headers["x-forwarded-for"] = `198.51.100.${(index % 250) + 1}`;
  }

  const response = await fetch(new URL("/api/auth/login", backendUrl), { method: "POST", headers, body: JSON.stringify({ email, password }) });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Login failed for ${email}: HTTP ${response.status} ${JSON.stringify(body).slice(0, 200)}`);
  }

  const data = unwrapEnvelope(body);
  const token = data?.accessToken ?? data?.token;

  if (typeof token !== "string") {
    throw new Error(`Login for ${email} returned no access token`);
  }

  return token;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
