/*
 * Funcionalidad: Caso de uso GetSectionsUseCase
 * Descripción: Lista las secciones ordenadas; los estudiantes solo reciben las publicadas; depende de ISectionQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";
import {
  type ISectionQueriesRepository,
  SECTION_QUERIES_REPOSITORY_TOKEN,
} from "@/features/sections/domain/repositories/section-queries.repository";

@Injectable()
export class GetSectionsUseCase {
  public constructor(
    @Inject(SECTION_QUERIES_REPOSITORY_TOKEN)
    private readonly _sectionQueriesRepository: ISectionQueriesRepository,
  ) {}

  public async execute(canManage: boolean): Promise<SectionSummary[]> {
    return await this._sectionQueriesRepository.getSummaries(canManage);
  }
}
