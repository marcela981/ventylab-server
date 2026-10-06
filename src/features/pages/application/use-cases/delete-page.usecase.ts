/*
 * Funcionalidad: Caso de uso DeletePageUseCase
 * Descripción: Elimina físicamente una página con sus bloques y revisiones cuando no hay datos de estudiantes (progreso de página o notas), delegando en DeleteCurriculumSubtreeUseCase; si los hay responde 409 sugiriendo archivar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { DeleteCurriculumSubtreeCommand } from "@/features/curriculum/application/commands/delete-curriculum-subtree.command";
import { DeleteCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/delete-curriculum-subtree.usecase";
import { PAGE_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";

/**
 * @throws {PageNotFoundError} If the page does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the page has student progress or notes
 */
@Injectable()
export class DeletePageUseCase {
  public constructor(private readonly _deleteCurriculumSubtreeUseCase: DeleteCurriculumSubtreeUseCase) {}

  public async execute(pageId: string, performedBy: string): Promise<void> {
    const deleted: boolean = await this._deleteCurriculumSubtreeUseCase.execute(new DeleteCurriculumSubtreeCommand({ kind: PAGE_NODE_KIND, id: pageId, performedBy }));

    if (!deleted) {
      throw new PageNotFoundError();
    }
  }
}
