/*
 * Funcionalidad: Puerto de repositorio STEP_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IStepQueriesRepository y su token de inyección para la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type StepDetail, type StepListItem, type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";

export const STEP_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("STEP_QUERIES_REPOSITORY_TOKEN");

export type StepNeighborDirection = "next" | "previous";

export interface GetStepsQuery extends ListQuery {
  lessonId?: string;
  includeInactive?: boolean;
}

export interface IStepQueriesRepository {
  getList(query: GetStepsQuery): Promise<Paginated<StepListItem>>;
  getDetail(stepId: string): Promise<StepDetail | undefined>;
  getActiveNeighbor(lessonId: string, order: number, direction: StepNeighborDirection): Promise<StepSummary | undefined>;
}
