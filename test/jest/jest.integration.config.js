/*
 * Funcionalidad: Configuración de Jest para la suite de integración
 * Descripción: Reutiliza la configuración unitaria de package.json (ts-jest, alias @/, reflect-metadata) y ejecuta los *.integration-spec.ts de src/ y test/ contra un PostgreSQL de Testcontainers arrancado una vez por ejecución; se corre con --runInBand porque todos los archivos comparten esa base de datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const { buildContainerSuiteConfig } = require("./jest.container-suite.config");

module.exports = buildContainerSuiteConfig({
  displayName: "integration",
  testRegex: "\\.integration-spec\\.ts$",
  globalSetup: "<rootDir>/test/jest/integration.global-setup.ts",
  testTimeout: 60_000,
});
