/*
 * Funcionalidad: Configuración de Sentry
 * Descripción: Lee SENTRY_DSN y NODE_ENV del entorno antes de que exista ConfigModule, cargando .env con dotenv
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as dotenv from "dotenv";

export interface SentryConfig {
  readonly dsn?: string;
  readonly environment?: string;
}

export function readSentryConfig(): SentryConfig {
  // Sentry starts before ConfigModule exists, so this loads .env itself; dotenv never overrides variables that are already set.
  dotenv.config();

  const dsn: string | undefined = process.env.SENTRY_DSN;

  return {
    dsn: dsn && dsn.length > 0 ? dsn : undefined,
    environment: process.env.NODE_ENV,
  };
}
