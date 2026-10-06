/*
 * Funcionalidad: Caso de uso GetModuleProgressUseCase
 * Descripción: Ejecuta la operación GetModuleProgress de la feature de módulos; depende de IModuleProgressRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type ModuleProgressView } from "@/features/modules/domain/read-models/module-progress.read-model";
import { type IModuleProgressRepository, MODULE_PROGRESS_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-progress.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 */
@Injectable()
export class GetModuleProgressUseCase {
  public constructor(
    @Inject(MODULE_PROGRESS_REPOSITORY_TOKEN)
    private readonly _moduleProgressRepository: IModuleProgressRepository,
  ) {}

  public async execute(userId: string, moduleId: string): Promise<ModuleProgressView> {
    const progress: ModuleProgressView | undefined = await this._moduleProgressRepository.getProgressEnsuringRecord(userId, moduleId);

    if (!progress) {
      throw new ModuleNotFoundError();
    }

    return progress;
  }
}
