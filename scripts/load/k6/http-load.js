/*
 * Funcionalidad: Prueba de carga HTTP con k6
 * Descripción: Simula una clase de 30 estudiantes y 2 docentes con JWT reales del inicio de sesión de la demostración: los estudiantes leen su progreso (overview, summary, módulo), su listado de evaluaciones y el módulo completo GET /api/modules/:id/full; los docentes leen el panel de analítica del grupo de 30 estudiantes y el listado de evaluaciones. Cada usuario virtual usa su propia dirección X-Forwarded-For (el backend confía en un salto de proxy y limita por IP, como con estudiantes reales detrás de Traefik). Exporta el resumen de k6 en JSON con p50/p95/p99 y tasa de error por endpoint
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import http from "k6/http";
import { check, fail, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://backend:4000";
const PASSWORD = __ENV.LOAD_PASSWORD || "VentyLab-Demo-2026";
const GROUP_ID = __ENV.GROUP_ID;
const STUDENT_EMAILS = (__ENV.STUDENT_EMAILS || "").split(",").filter((email) => email.length > 0);
const TEACHER_EMAILS = (__ENV.TEACHER_EMAILS || "ana.torres@ventylab.demo,luis.herrera@ventylab.demo").split(",");
const STUDENT_VUS = Number(__ENV.STUDENT_VUS || 30);
const TEACHER_VUS = Number(__ENV.TEACHER_VUS || 2);
const DURATION = __ENV.DURATION || "3m";
const THINK_SECONDS = Number(__ENV.THINK_SECONDS || 1);
const SUMMARY_PATH = __ENV.SUMMARY_PATH || "/out/http-summary.json";

const ENDPOINTS = {
  progress_overview: "GET /api/progress/overview",
  progress_summary: "GET /api/progress/summary",
  progress_module: "GET /api/progress/modules/:moduleId",
  my_evaluations: "GET /api/my-evaluations",
  module_full: "GET /api/modules/:id/full",
  analytics_group_dashboard: "GET /api/analytics/groups/:groupId/dashboard (30 students)",
  evaluations_list: "GET /api/evaluations",
};

const thresholds = {};

for (const endpoint of Object.keys(ENDPOINTS)) {
  thresholds[`http_req_duration{endpoint:${endpoint}}`] = ["p(95)<1000"];
  thresholds[`http_req_failed{endpoint:${endpoint}}`] = ["rate<0.01"];
}

export const options = {
  scenarios: {
    students: { executor: "constant-vus", vus: STUDENT_VUS, duration: DURATION, exec: "studentFlow" },
    teachers: { executor: "constant-vus", vus: TEACHER_VUS, duration: DURATION, exec: "teacherFlow" },
  },
  thresholds,
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max", "count"],
  setupTimeout: "120s",
};

function forwardedFor(index) {
  return `10.77.${Math.floor(index / 250)}.${(index % 250) + 1}`;
}

function unwrap(response) {
  const body = response.json();

  return body && typeof body === "object" && "data" in body ? body.data : body;
}

function login(email, index) {
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password: PASSWORD }), {
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${(index % 250) + 1}` },
    tags: { endpoint: "login" },
  });

  if (response.status !== 200 && response.status !== 201) {
    fail(`login ${email} answered ${response.status}: ${response.body}`);
  }

  return unwrap(response).accessToken;
}

function firstModuleId(token) {
  const response = http.get(`${BASE_URL}/api/modules`, { headers: { authorization: `Bearer ${token}` }, tags: { endpoint: "setup" } });
  const data = unwrap(response);
  const list = Array.isArray(data) ? data : data?.items ?? data?.modules ?? [];

  if (list.length === 0 || !list[0].id) {
    fail(`GET /api/modules returned no module (${response.status})`);
  }

  return list[0].id;
}

export function setup() {
  if (!GROUP_ID || STUDENT_EMAILS.length === 0) {
    fail("GROUP_ID and STUDENT_EMAILS are required (run scripts/load/seed-load-data.ts first)");
  }

  const studentTokens = STUDENT_EMAILS.slice(0, STUDENT_VUS).map((email, index) => login(email, index));
  const teacherTokens = TEACHER_EMAILS.map((email, index) => login(email, 200 + index));

  return { studentTokens, teacherTokens, moduleId: firstModuleId(studentTokens[0]) };
}

function get(path, token, endpoint, vuIndex) {
  const response = http.get(`${BASE_URL}${path}`, {
    headers: { authorization: `Bearer ${token}`, "x-forwarded-for": forwardedFor(vuIndex) },
    tags: { endpoint, name: ENDPOINTS[endpoint] },
  });

  check(response, { [`${endpoint} 2xx`]: (r) => r.status >= 200 && r.status < 300 });
  sleep(THINK_SECONDS);

  return response;
}

export function studentFlow(data) {
  const index = (__VU - 1) % data.studentTokens.length;
  const token = data.studentTokens[index];

  get("/api/progress/overview", token, "progress_overview", __VU);
  get("/api/progress/summary", token, "progress_summary", __VU);
  get(`/api/progress/modules/${data.moduleId}`, token, "progress_module", __VU);
  get("/api/my-evaluations", token, "my_evaluations", __VU);
  get(`/api/modules/${data.moduleId}/full`, token, "module_full", __VU);
}

export function teacherFlow(data) {
  const token = data.teacherTokens[(__VU - 1) % data.teacherTokens.length];

  get(`/api/analytics/groups/${GROUP_ID}/dashboard`, token, "analytics_group_dashboard", __VU);
  get("/api/evaluations", token, "evaluations_list", __VU);
}

function fmt(value) {
  return value === undefined || value === null ? "-" : Number(value).toFixed(1);
}

export function handleSummary(data) {
  const rows = Object.keys(ENDPOINTS).map((endpoint) => {
    const duration = data.metrics[`http_req_duration{endpoint:${endpoint}}`]?.values ?? {};
    const failed = data.metrics[`http_req_failed{endpoint:${endpoint}}`]?.values ?? {};

    return `${endpoint.padEnd(26)} n=${String(duration.count ?? 0).padStart(6)}  p50=${fmt(duration.med).padStart(7)}  p95=${fmt(duration["p(95)"]).padStart(7)}  p99=${fmt(duration["p(99)"]).padStart(7)}  max=${fmt(duration.max).padStart(7)} ms  errors=${fmt((failed.rate ?? 0) * 100)} %`;
  });

  const total = data.metrics.http_reqs?.values ?? {};
  const header = `VUs: ${STUDENT_VUS} students + ${TEACHER_VUS} teachers, duration ${DURATION}, think time ${THINK_SECONDS} s, requests ${total.count ?? 0} (${fmt(total.rate)} req/s)`;

  return {
    [SUMMARY_PATH]: JSON.stringify(data, null, 2),
    stdout: `\n${header}\n${rows.join("\n")}\n`,
  };
}
