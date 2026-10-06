/*
 * Funcionalidad: Inicialización de Sentry
 * Descripción: Inicializa Sentry antes de cargar NestJS usando la configuración leída por readSentryConfig
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as Sentry from "@sentry/nestjs";

import { readSentryConfig, type SentryConfig } from "@/common/infrastructure/config/sentry-config";

const sentryConfig: SentryConfig = readSentryConfig();

if (sentryConfig.dsn) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
  });
}
