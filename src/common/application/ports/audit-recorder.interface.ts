/*
 * Funcionalidad: Puerto IAuditRecorder
 * Descripción: Contrato para registrar en la bitácora de auditoría una acción de un actor sobre un objetivo con su estado anterior y posterior (solo los campos que cambian), dentro de la transacción activa; las opciones añaden motivo, descripción, metadatos y, si no se toman del contexto de la petición, rol del actor, identificador de petición e IP
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AUDIT_RECORDER_TOKEN: unique symbol = Symbol("AUDIT_RECORDER_TOKEN");

export interface AuditRecordOptions {
  readonly reason?: string;
  readonly description?: string;
  readonly metadata?: Record<string, unknown>;
  readonly actorRole?: string;
  readonly requestId?: string;
  readonly ip?: string;
}

export interface IAuditRecorder {
  record(
    actorId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    transaction?: unknown,
    options?: AuditRecordOptions,
  ): Promise<void>;
}
