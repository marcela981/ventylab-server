/*
 * Funcionalidad: Caso de uso GetStudentScoresUseCase
 * Descripción: Lista las calificaciones de un estudiante con el profesor que las asignó; los administradores ven todas, los profesores solo las propias
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GetStudentScoresCommand } from "@/features/scores/application/commands/get-student-scores.command";
import { type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { type IScoresRepository, SCORES_REPOSITORY_TOKEN } from "@/features/scores/domain/repositories/scores.repository";
import { ADMIN_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

@Injectable()
export class GetStudentScoresUseCase {
  public constructor(
    @Inject(SCORES_REPOSITORY_TOKEN)
    private readonly _scoresRepository: IScoresRepository,
  ) {}

  public async execute(command: GetStudentScoresCommand): Promise<ScoreView[]> {
    const seesAll: boolean = command.requesterRole === ADMIN_ROLE_VALUE;

    return await this._scoresRepository.getStudentScores(command.studentId, seesAll ? undefined : command.requesterId);
  }
}
