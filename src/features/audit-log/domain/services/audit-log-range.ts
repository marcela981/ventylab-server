/*
 * Funcionalidad: Validación del rango de fechas de auditoría
 * Descripción: Comprueba que el rango de fechas de una consulta de auditoría empiece antes de terminar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAuditLogRangeError } from "@/features/audit-log/domain/audit-log.errors";
import { type AuditLogFilters } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";

export function assertValidAuditLogRange(filters: AuditLogFilters): void {
  if (filters.from && filters.to && filters.from.getTime() >= filters.to.getTime()) {
    throw new InvalidAuditLogRangeError();
  }
}
