/*
 * Funcionalidad: Caso de uso RecordLearningActivityUseCase
 * Descripción: Registra de forma idempotente un hecho de aprendizaje en el registro de actividad con el XP de las reglas de gamificación y su día de America/Bogota; devuelve si se insertó (falso si ya existía)
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { RecordLearningActivityCommand } from "@/features/progress/application/commands/record-learning-activity.command";
import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";
import { toBogotaLocalDate } from "@/features/progress/domain/services/activity-calendar";
import { xpForActivity } from "@/features/progress/domain/services/gamification-rules";

@Injectable()
export class RecordLearningActivityUseCase {
  public constructor(
    @Inject(LEARNING_ACTIVITY_REPOSITORY_TOKEN)
    private readonly _learningActivityRepository: ILearningActivityRepository,
  ) {}

  public async execute(command: RecordLearningActivityCommand): Promise<boolean> {
    return await this._learningActivityRepository.record({
      userId: command.userId,
      kind: command.kind,
      refId: command.refId,
      xp: xpForActivity(command.kind, command.achievementReward),
      occurredAt: command.occurredAt,
      localDate: toBogotaLocalDate(command.occurredAt),
    });
  }
}
