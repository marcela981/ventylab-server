/*
 * Funcionalidad: Mapeador de presentación CurriculumTreeMapper
 * Descripción: Convierte el árbol curricular del estudiante (modelo de lectura) en los DTOs de respuesta HTTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type StudentCurriculumTree,
  type StudentTreeLevel,
  type StudentTreeModule,
  type StudentTreeSection,
} from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import { type NamedReference } from "@/features/curriculum/domain/services/unlock-rules";
import {
  NamedReferenceDTO,
  StudentCurriculumTreeDTO,
  StudentTreeLevelDTO,
  StudentTreeModuleDTO,
  StudentTreeSectionDTO,
} from "@/features/curriculum/presentation/dtos/curriculum-tree.dto";

export class CurriculumTreeMapper {
  public static toDTO(tree: StudentCurriculumTree): StudentCurriculumTreeDTO {
    return new StudentCurriculumTreeDTO({
      sections: tree.sections.map(
        (section: StudentTreeSection) =>
          new StudentTreeSectionDTO({
            id: section.id,
            slug: section.slug,
            title: section.title,
            description: section.description ?? null,
            order: section.order,
            status: section.status,
            levels: section.levels.map((level: StudentTreeLevel) => CurriculumTreeMapper._toLevelDTO(level)),
          }),
      ),
      unsectionedLevels: tree.unsectionedLevels.map((level: StudentTreeLevel) => CurriculumTreeMapper._toLevelDTO(level)),
    });
  }

  public static toReferencesDTO(references: ReadonlyArray<NamedReference>): NamedReferenceDTO[] {
    return references.map((reference: NamedReference) => new NamedReferenceDTO({ id: reference.id, title: reference.title }));
  }

  private static _toLevelDTO(level: StudentTreeLevel): StudentTreeLevelDTO {
    return new StudentTreeLevelDTO({
      id: level.id,
      sectionId: level.sectionId ?? null,
      title: level.title,
      description: level.description ?? null,
      track: level.track,
      order: level.order,
      status: level.status,
      locked: level.locked,
      completed: level.completed,
      missingPrerequisites: CurriculumTreeMapper.toReferencesDTO(level.missingPrerequisites),
      modules: level.modules.map(
        (module: StudentTreeModule) =>
          new StudentTreeModuleDTO({
            id: module.id,
            title: module.title,
            description: module.description ?? null,
            order: module.order,
            status: module.status,
            lessonCount: module.lessonCount,
            locked: module.locked,
            completed: module.completed,
            missingPrerequisites: CurriculumTreeMapper.toReferencesDTO(module.missingPrerequisites),
          }),
      ),
    });
  }
}
