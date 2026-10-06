/*
 * Funcionalidad: Mapeador de presentación SectionsMapper
 * Descripción: Convierte los modelos de lectura de secciones en los DTOs de respuesta HTTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SectionLevelItem, type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";
import { SectionDTO, SectionLevelDTO } from "@/features/sections/presentation/dtos/section.dto";

export class SectionsMapper {
  public static toDTO(section: SectionSummary): SectionDTO {
    return new SectionDTO({
      id: section.id,
      slug: section.slug,
      title: section.title,
      description: section.description ?? null,
      order: section.order,
      status: section.status,
      levelCount: section.levelCount,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    });
  }

  public static toLevelDTO(level: SectionLevelItem): SectionLevelDTO {
    return new SectionLevelDTO({
      id: level.id,
      title: level.title,
      description: level.description ?? null,
      track: level.track,
      order: level.order,
      status: level.status,
      moduleCount: level.moduleCount,
    });
  }
}
