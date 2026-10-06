/*
 * Funcionalidad: Caso de uso GetModuleLessonsCountUseCase
 * Descripción: Ejecuta la operación GetModuleLessonsCount de la feature de módulos; depende de IModuleQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IModuleQueriesRepository, MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";

@Injectable()
export class GetModuleLessonsCountUseCase {
  public constructor(
    @Inject(MODULE_QUERIES_REPOSITORY_TOKEN)
    private readonly _moduleQueriesRepository: IModuleQueriesRepository,
  ) {}

  public async execute(moduleId: string, canManage: boolean): Promise<number> {
    return await this._moduleQueriesRepository.countLessons(moduleId, canManage);
  }
}
