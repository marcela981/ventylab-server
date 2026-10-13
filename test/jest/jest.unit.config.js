/*
 * Funcionalidad: Configuración de Jest para la suite unitaria con cobertura de reglas de negocio
 * Descripción: Reutiliza la configuración unitaria de package.json (rootDir src) y limita la cobertura al alcance C1 (progreso, calificación de evaluaciones, puntaje y motor de simulación, reservas y desalojo, orquestador y gateway de IA, límites de la configuración de plataforma); exige al menos 80 % de líneas en cada carpeta del alcance por separado y escribe los reportes en coverage/unit (ignorado por git)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const { resolve } = require("node:path");

const REPO_ROOT = resolve(__dirname, "..", "..");
const unit = require(resolve(REPO_ROOT, "package.json")).jest;

const LINE_THRESHOLD = 80;

const { C1_AREAS } = require("./c1-coverage-areas");

// Each folder is its own threshold key: Jest aggregates a directory key over its files, so every folder of every area must reach the threshold separately.
// Keys are absolute because Jest resolves threshold paths against the working directory, not rootDir.
const C1_FOLDERS = Object.values(C1_AREAS).flat();

module.exports = {
  ...unit,
  rootDir: resolve(REPO_ROOT, "src"),
  collectCoverageFrom: [
    ...C1_FOLDERS.map((folder) => `${folder}/**/*.ts`),
    "!**/*.spec.ts",
    "!**/*-spec.ts",
    "!**/*.module.ts",
    "!**/index.ts",
    "!**/*.interface.ts",
    "!**/*.types.ts",
  ],
  coverageDirectory: resolve(REPO_ROOT, "coverage", "unit"),
  coverageReporters: ["text-summary", "json-summary"],
  coverageThreshold: Object.fromEntries(C1_FOLDERS.map((folder) => [resolve(REPO_ROOT, "src", folder), { lines: LINE_THRESHOLD }])),
};
