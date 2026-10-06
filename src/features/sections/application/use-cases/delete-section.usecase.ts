/*
 * Funcionalidad: Caso de uso DeleteSectionUseCase
 * Descripción: Elimina físicamente una sección con sus niveles, módulos, lecciones y páginas cuando no hay datos de estudiantes, delegando en DeleteCurriculumSubtreeUseCase; si los hay responde 409 sugiriendo archivar
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
import { SECTION_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {SectionNotFoundError} If the section does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the section or any descendant has student data
 */
@Injectable()
export class DeleteSectionUseCase {
  public constructor(private readonly _deleteCurriculumSubtreeUseCase: DeleteCurriculumSubtreeUseCase) {}

  public async execute(sectionId: string, performedBy: string): Promise<void> {
    const deleted: boolean = await this._deleteCurriculumSubtreeUseCase.execute(
      new DeleteCurriculumSubtreeCommand({ kind: SECTION_NODE_KIND, id: sectionId, performedBy }),
    );

    if (!deleted) {
      throw new SectionNotFoundError();
    }
  }
}
