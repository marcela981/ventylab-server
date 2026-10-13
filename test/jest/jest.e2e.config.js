/*
 * Funcionalidad: Configuración de Jest para la suite e2e
 * Descripción: Reutiliza la configuración unitaria de package.json y ejecuta test/e2e/**\/*.e2e-spec.ts contra la aplicación Nest completa con PostgreSQL y Mosquitto de Testcontainers arrancados una vez por ejecución; se corre con --runInBand porque todos los archivos comparten esos contenedores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const { buildContainerSuiteConfig } = require("./jest.container-suite.config");

module.exports = buildContainerSuiteConfig({
  displayName: "e2e",
  roots: ["<rootDir>/test/e2e"],
  testRegex: "\\.e2e-spec\\.ts$",
  globalSetup: "<rootDir>/test/jest/e2e.global-setup.ts",
  testTimeout: 120_000,
});
