/*
 * Funcionalidad: Caso de uso BackfillLearningActivityUseCase
 * Descripción: Rellena una sola vez por versión el registro de actividad con la historia anterior (vistas de página, lecciones y módulos completados, primera aprobación de cada evaluación publicada y logros), con inserción que omite en conflicto; guarda la versión aplicada y permite forzar una nueva pasada idempotente
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";

// Bump when the backfill gains a source, so existing deployments run the (idempotent) pass again on the next start.
export const LEARNING_ACTIVITY_BACKFILL_VERSION: string = "1";

export interface LearningActivityBackfillOutcome {
  readonly skipped: boolean;
  readonly inserted: number;
}

@Injectable()
export class BackfillLearningActivityUseCase {
  public constructor(
    @Inject(LEARNING_ACTIVITY_REPOSITORY_TOKEN)
    private readonly _learningActivityRepository: ILearningActivityRepository,
  ) {}

  public async execute({ passingGrade, force = false }: { passingGrade: number; force?: boolean }): Promise<LearningActivityBackfillOutcome> {
    if (!force && (await this._learningActivityRepository.getBackfillVersion()) === LEARNING_ACTIVITY_BACKFILL_VERSION) {
      return { skipped: true, inserted: 0 };
    }

    const inserted: number = await this._learningActivityRepository.backfill({ passingGrade });

    await this._learningActivityRepository.setBackfillVersion(LEARNING_ACTIVITY_BACKFILL_VERSION);

    return { skipped: false, inserted };
  }
}
