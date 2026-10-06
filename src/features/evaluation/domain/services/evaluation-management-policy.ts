/*
 * Funcionalidad: Política de gestión de evaluaciones
 * Descripción: Regla pura de alcance por rol: ADMIN gestiona todas las evaluaciones (incluidas las heredadas sin autor) y TEACHER solo las que creó; además define la clave del candado transaccional que serializa las ediciones de una evaluación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const ADMIN_EVALUATION_ACTOR_ROLE: string = "ADMIN";
export const TEACHER_EVALUATION_ACTOR_ROLE: string = "TEACHER";

export interface EvaluationActor {
  readonly id: string;
  readonly role: string;
}

export interface ManagedEvaluation {
  readonly createdById?: string;
}

export function canManageEvaluation(actor: EvaluationActor, evaluation: ManagedEvaluation): boolean {
  if (actor.role === ADMIN_EVALUATION_ACTOR_ROLE) {
    return true;
  }

  return actor.role === TEACHER_EVALUATION_ACTOR_ROLE && evaluation.createdById !== undefined && evaluation.createdById === actor.id;
}

export function evaluationStructureLockKey(evaluationId: string): string {
  return `evaluations:structure:${evaluationId}`;
}
