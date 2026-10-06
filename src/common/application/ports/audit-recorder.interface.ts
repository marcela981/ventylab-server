/*
 * Funcionalidad: Puerto IAuditRecorder
 * Descripción: Contrato para registrar en la bitácora de auditoría una acción de un actor sobre un objetivo con su estado anterior y posterior, dentro de la transacción activa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AUDIT_RECORDER_TOKEN: unique symbol = Symbol("AUDIT_RECORDER_TOKEN");

export interface IAuditRecorder {
  record(
    actorId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    transaction?: unknown,
  ): Promise<void>;
}
