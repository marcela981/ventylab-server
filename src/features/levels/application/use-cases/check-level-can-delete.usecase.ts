/*
 * Funcionalidad: Caso de uso CheckLevelCanDeleteUseCase
 * Descripción: Informa si un nivel puede eliminarse físicamente aplicando la guarda de eliminación curricular (datos de estudiantes en el nivel o sus descendientes) y lista los niveles activos que dependen de él; depende de InspectCurriculumSubtreeUseCase e ILevelQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { InspectCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/inspect-curriculum-subtree.usecase";
import { type CurriculumDeleteInspection, LEVEL_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { ARCHIVE_REQUIRED_DECISION } from "@/features/curriculum/domain/services/delete-guard";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type CanDeleteLevelResult } from "@/features/levels/domain/read-models/level-views.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";

export const LEVEL_HAS_STUDENT_DATA_REASON: string = "level_has_student_data";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 */
@Injectable()
export class CheckLevelCanDeleteUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
    private readonly _inspectCurriculumSubtreeUseCase: InspectCurriculumSubtreeUseCase,
  ) {}

  public async execute(levelId: string): Promise<CanDeleteLevelResult> {
    const inspection: CurriculumDeleteInspection | undefined = await this._inspectCurriculumSubtreeUseCase.execute(LEVEL_NODE_KIND, levelId);

    if (!inspection) {
      throw new LevelNotFoundError();
    }

    const dependentLevels: string[] = await this._levelQueriesRepository.getActiveDependentLevelTitles(levelId);
    const hasStudentProgress: boolean = inspection.decision === ARCHIVE_REQUIRED_DECISION;

    return {
      canDelete: !hasStudentProgress,
      reason: hasStudentProgress ? LEVEL_HAS_STUDENT_DATA_REASON : undefined,
      dependentLevels: dependentLevels.length > 0 ? dependentLevels : undefined,
      hasStudentProgress,
    };
  }
}
