/*
 * Funcionalidad: Repositorio de evaluaciones
 * Descripción: Contrato de persistencia del agregado Evaluation (carga completa con escenarios, preguntas y opciones, guardado de los cambios pendientes y reordenamientos, borrado físico), del listado paginado de gestión, de los conteos de uso que deciden el bloqueo estructural y el borrado, de la verificación de medios y referencias curriculares o clínicas existentes y del candado transaccional por evaluación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationSummaryView, type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const EVALUATIONS_REPOSITORY_TOKEN: unique symbol = Symbol("EVALUATIONS_REPOSITORY_TOKEN");

export const EVALUATION_SORT_BY_VALUES: readonly ["createdAt", "updatedAt", "title", "order"] = ["createdAt", "updatedAt", "title", "order"] as const;

export type EvaluationSortByValue = (typeof EVALUATION_SORT_BY_VALUES)[number];

export interface GetEvaluationsQuery extends ListQuery {
  type?: EvaluationTypeValue;
  status?: EvaluationStatusValue;
  search?: string;
  createdById?: string;
  sortBy?: EvaluationSortByValue;
}

export interface EvaluationReferences {
  moduleId?: string;
  levelId?: string;
  lessonId?: string;
  clinicalCaseId?: string;
}

export interface IEvaluationsRepository {
  getById(id: string, transaction?: unknown): Promise<Evaluation | undefined>;
  getSummaries(query: GetEvaluationsQuery): Promise<Paginated<EvaluationSummaryView>>;
  getUsage(id: string, transaction?: unknown): Promise<EvaluationUsage>;
  findMissingMediaIds(mediaIds: ReadonlyArray<string>, transaction?: unknown): Promise<string[]>;
  findMissingReferences(references: EvaluationReferences, transaction?: unknown): Promise<string[]>;
  acquireTransactionLock(key: string, transaction: unknown): Promise<void>;
  save(evaluation: Evaluation, transaction?: unknown): Promise<void>;
  delete(evaluation: Evaluation, transaction?: unknown): Promise<void>;
}
