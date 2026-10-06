/*
 * Funcionalidad: Caso de uso GetStepsUseCase
 * Descripción: Ejecuta la operación GetSteps de la feature de pasos (tarjetas); depende de IStepQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type StepListItem } from "@/features/steps/domain/read-models/step-views.read-model";
import {
  type GetStepsQuery,
  type IStepQueriesRepository,
  STEP_QUERIES_REPOSITORY_TOKEN,
} from "@/features/steps/domain/repositories/step-queries.repository";

@Injectable()
export class GetStepsUseCase {
  public constructor(
    @Inject(STEP_QUERIES_REPOSITORY_TOKEN)
    private readonly _stepQueriesRepository: IStepQueriesRepository,
  ) {}

  public async execute(query: GetStepsQuery): Promise<Paginated<StepListItem>> {
    return await this._stepQueriesRepository.getList(query);
  }
}
