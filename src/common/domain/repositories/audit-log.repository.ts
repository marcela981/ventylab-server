/*
 * Funcionalidad: Repositorio IAuditLogRepository
 * Descripción: Define el contrato y el token de inyección para persistir registros de auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AuditLog } from "@/common/domain/entities/audit-log.entity";

export const AUDIT_LOG_REPOSITORY_TOKEN: unique symbol = Symbol("AUDIT_LOG_REPOSITORY_TOKEN");

export interface IAuditLogRepository {
  save(
    entityCollection: string,
    entityType: string,
    entityId: string,
    logs: ReadonlyArray<AuditLog>,
    transaction?: unknown,
  ): Promise<void>;
}
