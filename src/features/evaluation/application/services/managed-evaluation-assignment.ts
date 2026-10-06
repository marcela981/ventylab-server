/*
 * Funcionalidad: Carga de asignaciones gestionables
 * Descripción: Dentro de la transacción toma el candado de la evaluación, carga la asignación, comprueba que pertenece a la evaluación de la ruta (404) y que el ejecutor gestiona su grupo (403)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { EvaluationAssignmentNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type IEvaluationAssignmentsRepository } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { type EvaluationActor, evaluationStructureLockKey } from "@/features/evaluation/domain/services/evaluation-management-policy";

export interface ManagedEvaluationAssignmentDependencies {
  evaluationsRepository: IEvaluationsRepository;
  assignmentsRepository: IEvaluationAssignmentsRepository;
  access: EvaluationAssignmentAccess;
}

export async function loadManagedEvaluationAssignment(
  { evaluationsRepository, assignmentsRepository, access }: ManagedEvaluationAssignmentDependencies,
  { evaluationId, assignmentId, actor }: { evaluationId: string; assignmentId: string; actor: EvaluationActor },
  transaction: unknown,
): Promise<EvaluationAssignment> {
  await evaluationsRepository.acquireTransactionLock(evaluationStructureLockKey(evaluationId), transaction);

  const assignment: EvaluationAssignment | undefined = await assignmentsRepository.getById(assignmentId, transaction);

  if (!assignment || assignment.evaluationId !== evaluationId) {
    throw new EvaluationAssignmentNotFoundError();
  }

  await access.assertCanManageGroups(actor, [assignment.groupId]);

  return assignment;
}
