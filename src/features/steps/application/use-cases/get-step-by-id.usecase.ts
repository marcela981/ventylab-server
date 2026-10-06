/*
 * Funcionalidad: Caso de uso GetStepByIdUseCase
 * Descripción: Ejecuta la operación GetStepById de la feature de pasos (tarjetas); depende de IStepQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type StepDetail } from "@/features/steps/domain/read-models/step-views.read-model";
import { type IStepQueriesRepository, STEP_QUERIES_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/step-queries.repository";
import { StepNotFoundError } from "@/features/steps/domain/steps.errors";

/**
 * @throws {StepNotFoundError} If the step does not exist
 */
@Injectable()
export class GetStepByIdUseCase {
  public constructor(
    @Inject(STEP_QUERIES_REPOSITORY_TOKEN)
    private readonly _stepQueriesRepository: IStepQueriesRepository,
  ) {}

  public async execute(stepId: string): Promise<StepDetail> {
    const step: StepDetail | undefined = await this._stepQueriesRepository.getDetail(stepId);

    if (!step) {
      throw new StepNotFoundError();
    }

    return step;
  }
}
