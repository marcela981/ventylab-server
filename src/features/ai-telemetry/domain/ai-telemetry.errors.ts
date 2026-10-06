/*
 * Funcionalidad: Errores de dominio de la telemetría de IA
 * Descripción: Errores de la feature ai-telemetry (rango de fechas inválido o demasiado amplio para estadísticas y exportación)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class InvalidAiTelemetryRangeError extends DomainError {
  public constructor() {
    super("The date range must start before it ends and span at most 366 days", "ai-telemetry.invalid_range");
  }
}
