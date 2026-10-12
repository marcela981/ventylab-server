/*
 * Funcionalidad: Errores de la bitácora de auditoría
 * Descripción: Errores de dominio de las consultas de auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class InvalidAuditLogRangeError extends DomainError {
  public constructor() {
    super("The date range must start before it ends", "audit-log.invalid_range");
  }
}
