/*
 * Funcionalidad: Caso de uso GetActivityCalendarUseCase
 * Descripción: Devuelve los días con actividad del usuario (conteo de eventos y XP por día de America/Bogota) en un rango de fechas ISO inclusivo de como máximo 366 días (por defecto, los 366 días que terminan hoy); rechaza fechas inválidas o desde posterior a hasta
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { InvalidActivityRangeError } from "@/features/progress/domain/gamification.errors";
import { type ActivityDay } from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";
import { addDays, countDaysInclusive, isLocalDate, type LocalDate, toBogotaLocalDate } from "@/features/progress/domain/services/activity-calendar";

export const MAX_ACTIVITY_RANGE_DAYS: number = 366;

/**
 * @throws {InvalidActivityRangeError} If a date is not YYYY-MM-DD, from is after to, or the range exceeds MAX_ACTIVITY_RANGE_DAYS
 */
@Injectable()
export class GetActivityCalendarUseCase {
  public constructor(
    @Inject(LEARNING_ACTIVITY_REPOSITORY_TOKEN)
    private readonly _learningActivityRepository: ILearningActivityRepository,
  ) {}

  public async execute(userId: string, range: { from?: LocalDate; to?: LocalDate } = {}, now: Date = new Date()): Promise<ActivityDay[]> {
    const to: LocalDate = range.to ?? toBogotaLocalDate(now);
    const from: LocalDate = range.from ?? (isLocalDate(to) ? addDays(to, 1 - MAX_ACTIVITY_RANGE_DAYS) : to);
    const days: number = isLocalDate(from) && isLocalDate(to) ? countDaysInclusive(from, to) : 0;

    if (days < 1 || days > MAX_ACTIVITY_RANGE_DAYS) {
      throw new InvalidActivityRangeError(MAX_ACTIVITY_RANGE_DAYS);
    }

    return await this._learningActivityRepository.getActivityDays(userId, from, to);
  }
}
