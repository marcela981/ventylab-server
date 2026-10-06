/*
 * Funcionalidad: Caso de uso GetGraderScoresUseCase
 * Descripción: Lista las calificaciones asignadas por un profesor, opcionalmente filtradas por estudiante, con los datos del estudiante calificado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { type IScoresRepository, SCORES_REPOSITORY_TOKEN } from "@/features/scores/domain/repositories/scores.repository";

@Injectable()
export class GetGraderScoresUseCase {
  public constructor(
    @Inject(SCORES_REPOSITORY_TOKEN)
    private readonly _scoresRepository: IScoresRepository,
  ) {}

  public async execute(graderId: string, studentId?: string): Promise<ScoreView[]> {
    return await this._scoresRepository.getGraderScores(graderId, studentId);
  }
}
