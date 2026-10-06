/*
 * Funcionalidad: Caso de uso GetAdjacentStepUseCase
 * Descripción: Ejecuta la operación GetAdjacentStep de la feature de pasos (tarjetas); depende de IStepQueriesRepository, IStepRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Step } from "@/features/steps/domain/entities/step.entity";
import { type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";
import {
  type IStepQueriesRepository,
  STEP_QUERIES_REPOSITORY_TOKEN,
  type StepNeighborDirection,
} from "@/features/steps/domain/repositories/step-queries.repository";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { StepNotFoundError } from "@/features/steps/domain/steps.errors";

/**
 * @throws {StepNotFoundError} If the current step does not exist
 */
@Injectable()
export class GetAdjacentStepUseCase {
  public constructor(
    @Inject(STEPS_REPOSITORY_TOKEN)
    private readonly _stepsRepository: IStepRepository,
    @Inject(STEP_QUERIES_REPOSITORY_TOKEN)
    private readonly _stepQueriesRepository: IStepQueriesRepository,
  ) {}

  public async execute(stepId: string, direction: StepNeighborDirection): Promise<StepSummary | undefined> {
    const step: Step | undefined = await this._stepsRepository.getById(stepId);

    if (!step) {
      throw new StepNotFoundError();
    }

    return await this._stepQueriesRepository.getActiveNeighbor(step.lessonId, step.order, direction);
  }
}
