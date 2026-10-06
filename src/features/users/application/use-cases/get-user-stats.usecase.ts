/*
 * Funcionalidad: Caso de uso GetUserStatsUseCase
 * Descripción: Calcula las estadísticas de aprendizaje del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type IUserStatisticsRepository,
  USER_STATISTICS_REPOSITORY_TOKEN,
} from "@/features/users/domain/repositories/user-statistics.repository";
import { type UserStats } from "@/features/users/domain/value-objects/user-stats";

@Injectable()
export class GetUserStatsUseCase {
  public constructor(
    @Inject(USER_STATISTICS_REPOSITORY_TOKEN)
    private readonly _userStatisticsRepository: IUserStatisticsRepository,
  ) {}

  public async execute(userId: string): Promise<UserStats> {
    return await this._userStatisticsRepository.getUserStats(userId);
  }
}
