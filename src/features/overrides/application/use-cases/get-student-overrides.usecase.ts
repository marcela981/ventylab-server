/*
 * Funcionalidad: Caso de uso GetStudentOverridesUseCase
 * Descripción: Ejecuta la operación GetStudentOverrides de la feature de personalizaciones de contenido por estudiante; depende de CanManageOverridesUseCase, IContentOverrideRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GetStudentOverridesCommand } from "@/features/overrides/application/commands/get-student-overrides.command";
import { CanManageOverridesUseCase } from "@/features/overrides/application/use-cases/can-manage-overrides.usecase";
import { CannotManageOverridesError } from "@/features/overrides/domain/overrides.errors";
import { type ContentOverrideView } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type IContentOverrideRepository, OVERRIDES_REPOSITORY_TOKEN } from "@/features/overrides/domain/repositories/overrides.repository";

/**
 * @throws {CannotManageOverridesError} If the requester cannot manage overrides for the student
 */
@Injectable()
export class GetStudentOverridesUseCase {
  public constructor(
    @Inject(OVERRIDES_REPOSITORY_TOKEN)
    private readonly _overridesRepository: IContentOverrideRepository,
    private readonly _canManageOverridesUseCase: CanManageOverridesUseCase,
  ) {}

  public async execute(command: GetStudentOverridesCommand): Promise<ContentOverrideView[]> {
    if (!(await this._canManageOverridesUseCase.execute(command.requesterId, command.requesterRole, command.studentId))) {
      throw new CannotManageOverridesError();
    }

    return await this._overridesRepository.getViewsForStudent({
      studentId: command.studentId,
      entityType: command.entityType,
      includeInactive: command.includeInactive,
    });
  }
}
