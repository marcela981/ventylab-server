/*
 * Funcionalidad: Configuración de Jest para las pruebas de contrato de la API
 * Descripción: Reutiliza la configuración unitaria de package.json con raíz en el repositorio y ejecuta test/openapi/**\/*.spec.ts, que leen openapi/openapi.json, openapi/asyncapi.yaml y el código fuente sin arrancar la aplicación ni contenedores
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

module.exports = {
  displayName: "contract",
  rootDir: REPO_ROOT,
  roots: ["<rootDir>/test/openapi"],
  moduleFileExtensions: unit.moduleFileExtensions,
  modulePaths: ["<rootDir>/src"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  transform: unit.transform,
  transformIgnorePatterns: unit.transformIgnorePatterns,
  testEnvironment: unit.testEnvironment,
  testRegex: "\.spec\.ts$",
  setupFiles: unit.setupFiles,
};
