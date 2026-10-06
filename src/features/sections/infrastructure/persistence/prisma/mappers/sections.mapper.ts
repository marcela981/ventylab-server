/*
 * Funcionalidad: Mapeador de persistencia SectionsMapper
 * Descripción: Convierte entre el modelo Section de Prisma y la entidad de dominio Section
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type Section as SectionModel } from "@prisma/client";

import { Section } from "@/features/sections/domain/entities/section.entity";

export class SectionsMapper {
  public static toDomain(row: SectionModel): Section {
    return Section.reconstitute({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      order: row.order,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(section: Section): Prisma.SectionUncheckedCreateInput {
    return {
      id: section.id,
      slug: section.slug,
      title: section.title,
      description: section.description ?? null,
      order: section.order,
      status: section.status,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}
