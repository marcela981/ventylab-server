/*
 * Funcionalidad: Base de configuración de Jest para suites con contenedores
 * Descripción: Deriva de la configuración unitaria de package.json una configuración con raíz en el repositorio (src/ y test/), alias @/ hacia src/, entorno explícito de pruebas antes de cada archivo, bloqueo de dotenv, globalSetup/globalTeardown de Testcontainers y sin cobertura
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

function buildContainerSuiteConfig({ displayName, roots = ["<rootDir>/src", "<rootDir>/test"], testRegex, globalSetup, testTimeout }) {
  return {
    displayName,
    rootDir: REPO_ROOT,
    roots,
    moduleFileExtensions: unit.moduleFileExtensions,
    modulePaths: ["<rootDir>/src"],
    moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
    transform: unit.transform,
    transformIgnorePatterns: unit.transformIgnorePatterns,
    testEnvironment: unit.testEnvironment,
    testRegex,
    setupFiles: ["<rootDir>/test/jest/test-env.setup.ts"],
    setupFilesAfterEnv: ["<rootDir>/test/jest/no-dotenv.setup.ts"],
    globalSetup,
    globalTeardown: "<rootDir>/test/jest/global-teardown.ts",
    testTimeout,
  };
}

module.exports = { buildContainerSuiteConfig };
