/*
 * Funcionalidad: Suite de aserciones de rendimiento
 * Descripción: Ejecuta en serie y sin cobertura las pruebas unitarias con presupuesto de tiempo (RUN_PERF_ASSERTIONS=1), para que los workers paralelos de test:unit no las vuelvan inestables; depende de jest en node_modules
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const jestBin = require.resolve("jest/bin/jest");

const result = spawnSync(
  process.execPath,
  [jestBin, "--ci", "--runInBand", "--coverage=false", "--testPathPatterns", "engine-determinism\\.spec\\.ts$"],
  { stdio: "inherit", env: { ...process.env, RUN_PERF_ASSERTIONS: "1" } },
);

process.exit(result.status ?? 1);
