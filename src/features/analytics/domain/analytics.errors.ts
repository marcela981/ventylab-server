/*
 * Funcionalidad: Errores de dominio de analítica
 * Descripción: Define los errores de la analítica docente, del estudiante y de investigación: recurso fuera del alcance del solicitante (403), grupo o evaluación inexistentes (404), rango de fechas inválido (422) y exportación anonimizada sin sal configurada (503)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class AnalyticsScopeForbiddenError extends DomainError {
  public constructor() {
    super("The requested analytics are outside your groups", "analytics.out_of_scope");
  }
}

export class AnalyticsGroupNotFoundError extends DomainError {
  public constructor() {
    super("Group not found", "analytics.group_not_found");
  }
}

export class AnalyticsEvaluationNotFoundError extends DomainError {
  public constructor() {
    super("Evaluation not found", "analytics.evaluation_not_found");
  }
}

export class InvalidAnalyticsRangeError extends DomainError {
  public constructor() {
    super("The date range must start before it ends and span at most 366 days", "analytics.invalid_range");
  }
}

export class AnalyticsExportNotConfiguredError extends DomainError {
  public constructor() {
    super("The anonymized export is not configured", "analytics.export_not_configured");
  }
}
