/*
 * Funcionalidad: Estructura publicada del progreso
 * Descripción: Carga con tres lecturas en paralelo la estructura publicada completa (secciones con sus niveles, niveles con sus módulos y módulos con su nivel, en orden) sobre la que se calcula el progreso ponderado por lecciones; la comparten el progreso de un usuario y el progreso por lotes de varios usuarios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PUBLISHED_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";
import { publishedLevelWhere, publishedModuleWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { type ProgressStructure, type ProgressStructureLevel } from "@/features/progress/domain/read-models/learning-progress.read-model";

export interface StructureLevelRow {
  id: string;
  sectionId: string | null;
  modules: { id: string }[];
}

export const PUBLISHED_MODULE_IDS_SELECT: { where: Prisma.ModuleWhereInput; orderBy: { order: "asc" }; select: { id: true } } = {
  where: publishedModuleWhere(),
  orderBy: { order: "asc" },
  select: { id: true },
};

export function toStructureLevel(row: StructureLevelRow): ProgressStructureLevel {
  return {
    id: row.id,
    sectionId: row.sectionId ?? undefined,
    moduleIds: row.modules.map((module: { id: string }) => module.id),
  };
}

export async function loadPublishedProgressStructure(client: PrismaExecutor): Promise<ProgressStructure> {
  const [sections, levels, modules] = await Promise.all([
    client.section.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS },
      orderBy: { order: "asc" },
      select: { id: true, levels: { where: publishedLevelWhere(), orderBy: { order: "asc" }, select: { id: true } } },
    }),
    client.level.findMany({
      where: publishedLevelWhere(),
      orderBy: { order: "asc" },
      select: { id: true, sectionId: true, modules: PUBLISHED_MODULE_IDS_SELECT },
    }),
    client.module.findMany({
      where: publishedModuleWhere(),
      orderBy: [{ level: { order: "asc" } }, { order: "asc" }],
      select: { id: true, levelId: true },
    }),
  ]);

  return {
    sections: sections.map((section: { id: string; levels: { id: string }[] }) => ({
      id: section.id,
      levelIds: section.levels.map((level: { id: string }) => level.id),
    })),
    levels: levels.map((level: StructureLevelRow) => toStructureLevel(level)),
    modules: modules.map((module: { id: string; levelId: string | null }) => ({ id: module.id, levelId: module.levelId ?? undefined })),
  };
}
