/*
 * Funcionalidad: Bloqueo de .env en pruebas
 * Descripción: Sustituye dotenv dentro del registro de módulos de Jest para que ni ConfigModule ni el lector de Sentry carguen el archivo .env del desarrollador durante las suites de integración y e2e
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
jest.mock("dotenv", (): Record<string, unknown> => ({
  ...jest.requireActual<Record<string, unknown>>("dotenv"),
  config: (): { parsed: Record<string, string> } => ({ parsed: {} }),
  configDotenv: (): { parsed: Record<string, string> } => ({ parsed: {} }),
  parse: (): Record<string, string> => ({}),
}));
