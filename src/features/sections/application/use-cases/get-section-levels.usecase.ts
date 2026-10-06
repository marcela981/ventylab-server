/*
 * Funcionalidad: Caso de uso GetSectionLevelsUseCase
 * Descripción: Lista los niveles de una sección visible para el lector; los estudiantes solo reciben niveles publicados de secciones publicadas; depende de ISectionQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type SectionLevelItem, type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";
import {
  type ISectionQueriesRepository,
  SECTION_QUERIES_REPOSITORY_TOKEN,
} from "@/features/sections/domain/repositories/section-queries.repository";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {SectionNotFoundError} If the section does not exist or is not visible to the reader
 */
@Injectable()
export class GetSectionLevelsUseCase {
  public constructor(
    @Inject(SECTION_QUERIES_REPOSITORY_TOKEN)
    private readonly _sectionQueriesRepository: ISectionQueriesRepository,
  ) {}

  public async execute(sectionId: string, canManage: boolean): Promise<SectionLevelItem[]> {
    const section: SectionSummary | undefined = await this._sectionQueriesRepository.getSummary(sectionId, canManage);

    if (!section) {
      throw new SectionNotFoundError();
    }

    return await this._sectionQueriesRepository.getLevels(sectionId, canManage);
  }
}
