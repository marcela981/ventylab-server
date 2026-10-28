/*
 * Funcionalidad: Errores de dominio de gamificación
 * Descripción: Define los errores de dominio de la gamificación (rango inválido del calendario de actividad: fechas ISO, desde ≤ hasta y un máximo de días)
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class InvalidActivityRangeError extends DomainError {
  public constructor(public readonly maxDays: number) {
    super("The activity range needs ISO dates with from <= to and at most the maximum number of days", "progress.invalid_activity_range");
  }

  public get i18nArgs(): Record<string, number> {
    return { maxDays: this.maxDays };
  }
}
