/*
 * Funcionalidad: Servicio LearningActivityBackfillService
 * Descripción: Al arrancar la aplicación ejecuta el relleno histórico idempotente del registro de actividad (una vez por versión, con la nota mínima aprobatoria vigente de las evaluaciones); registra el resultado con el Logger de Nest y un fallo no impide el arranque
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";

import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import {
  BackfillLearningActivityUseCase,
  type LearningActivityBackfillOutcome,
} from "@/features/progress/application/use-cases/backfill-learning-activity.usecase";

@Injectable()
export class LearningActivityBackfillService implements OnApplicationBootstrap {
  private readonly _logger: Logger = new Logger(LearningActivityBackfillService.name);

  public constructor(
    private readonly _backfillLearningActivityUseCase: BackfillLearningActivityUseCase,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      const outcome: LearningActivityBackfillOutcome = await this._backfillLearningActivityUseCase.execute({ passingGrade: this._gradingConfig.passingGrade });

      if (!outcome.skipped) {
        this._logger.log(`Learning activity backfill: ${outcome.inserted} ledger entries inserted`);
      }
    } catch (error) {
      this._logger.error(`Learning activity backfill failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
