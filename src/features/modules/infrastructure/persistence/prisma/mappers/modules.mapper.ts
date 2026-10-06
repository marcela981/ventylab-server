/*
 * Funcionalidad: Mapeador de persistencia ModuleRow
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de módulos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Module as ModuleModel, type Prisma } from "@prisma/client";

import { Module } from "@/features/modules/domain/entities/module.entity";

export type ModuleRow = ModuleModel & { prerequisites: { prerequisiteId: string }[] };

export class ModulesMapper {
  public static toDomain(row: ModuleRow): Module {
    return Module.reconstitute({
      id: row.id,
      levelId: row.levelId ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      difficulty: row.difficulty ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      thumbnail: row.thumbnail ?? undefined,
      order: row.order,
      isActive: row.isActive,
      status: row.status,
      color: row.color ?? undefined,
      tags: row.tags,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      prerequisiteIds: row.prerequisites.map((prerequisite: { prerequisiteId: string }) => prerequisite.prerequisiteId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(module: Module): Prisma.ModuleUncheckedCreateInput {
    return {
      id: module.id,
      levelId: module.levelId ?? null,
      title: module.title,
      description: module.description ?? null,
      category: module.category ?? null,
      difficulty: module.difficulty ?? null,
      estimatedTime: module.estimatedTime ?? null,
      thumbnail: module.thumbnail ?? null,
      order: module.order,
      isActive: module.isActive,
      status: module.status,
      color: module.color ?? null,
      tags: [...module.tags],
      lastModifiedBy: module.lastModifiedBy ?? null,
      lastModifiedAt: module.lastModifiedAt ?? null,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }
}
