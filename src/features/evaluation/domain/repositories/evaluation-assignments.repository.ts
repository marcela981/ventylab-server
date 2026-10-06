/*
 * Funcionalidad: Repositorio de asignaciones de evaluación
 * Descripción: Contrato de persistencia del agregado EvaluationAssignment (carga, guardado, borrado, asignaciones de una evaluación en ciertos grupos, datos del grupo destino, conteo de intentos) y de sus vistas de lectura: por evaluación, listado paginado de gestión filtrado por grupo, evaluación y estado derivado, y asignaciones del grupo STUDENT de un estudiante; el alcance de un profesor son los grupos STUDENT que creó o que supervisa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import {
  type EvaluationAssignmentGroupTarget,
  type EvaluationAssignmentView,
} from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import { type EvaluationAssignmentStateValue } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

export const EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN: unique symbol = Symbol("EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN");

export interface EvaluationAssignmentScope {
  readonly teacherId: string;
  readonly supervisedGroupIds: ReadonlyArray<string>;
}

export interface GetEvaluationAssignmentsQuery extends ListQuery {
  groupId?: string;
  evaluationId?: string;
  state?: EvaluationAssignmentStateValue;
  now: Date;
  scope?: EvaluationAssignmentScope;
}

export interface IEvaluationAssignmentsRepository {
  getById(id: string, transaction?: unknown): Promise<EvaluationAssignment | undefined>;
  getByEvaluationAndGroups(evaluationId: string, groupIds: ReadonlyArray<string>, transaction?: unknown): Promise<EvaluationAssignment[]>;
  getGroupTargets(groupIds: ReadonlyArray<string>, transaction?: unknown): Promise<EvaluationAssignmentGroupTarget[]>;
  countAttempts(assignmentId: string, transaction?: unknown): Promise<number>;
  getViews(query: GetEvaluationAssignmentsQuery): Promise<Paginated<EvaluationAssignmentView>>;
  getViewsByEvaluation(evaluationId: string, scope?: EvaluationAssignmentScope): Promise<EvaluationAssignmentView[]>;
  getStudentGroupViews(groupId: string): Promise<EvaluationAssignmentView[]>;
  save(assignment: EvaluationAssignment, transaction?: unknown): Promise<void>;
  delete(id: string, transaction?: unknown): Promise<void>;
}
