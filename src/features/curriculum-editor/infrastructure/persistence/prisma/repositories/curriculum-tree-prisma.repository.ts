/*
 * Funcionalidad: Repositorio Prisma CurriculumTreePrismaRepository
 * Descripción: Implementa ICurriculumTreeRepository sobre PrismaService y resolveClient para la feature de editor del currículo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type CurriculumTreeLevel } from "@/features/curriculum-editor/domain/read-models/curriculum-tree.read-model";
import { type ICurriculumTreeRepository } from "@/features/curriculum-editor/domain/repositories/curriculum-tree.repository";

type TreeLevelRow = Prisma.LevelGetPayload<{
  include: {
    modules: {
      include: {
        lessons: {
          select: { id: true; title: true; slug: true; order: true; color: true; tags: true; isActive: true; status: true; estimatedTime: true; blocks: true };
        };
      };
    };
  };
}>;

type TreeModuleRow = TreeLevelRow["modules"][number];
type TreeLessonRow = TreeModuleRow["lessons"][number];

@Injectable()
export class CurriculumTreePrismaRepository implements ICurriculumTreeRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getLevelsWithContent(track?: string): Promise<CurriculumTreeLevel[]> {
    const rows: TreeLevelRow[] = await this._prisma.level.findMany({
      where: track ? { track } : undefined,
      orderBy: { order: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, slug: true, order: true, color: true, tags: true, isActive: true, status: true, estimatedTime: true, blocks: true },
            },
          },
        },
      },
    });

    return rows.map((row: TreeLevelRow) => ({
      id: row.id,
      title: row.title,
      track: row.track,
      description: row.description ?? undefined,
      order: row.order,
      isActive: row.isActive,
      status: row.status,
      color: row.color ?? undefined,
      tags: row.tags,
      parentId: row.parentId ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      modules: row.modules.map((module: TreeModuleRow) => ({
        id: module.id,
        levelId: module.levelId ?? undefined,
        title: module.title,
        description: module.description ?? undefined,
        category: module.category ?? undefined,
        difficulty: module.difficulty ?? undefined,
        estimatedTime: module.estimatedTime ?? undefined,
        thumbnail: module.thumbnail ?? undefined,
        order: module.order,
        isActive: module.isActive,
        status: module.status,
        color: module.color ?? undefined,
        tags: module.tags,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        lessons: module.lessons.map((lesson: TreeLessonRow) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug ?? undefined,
          order: lesson.order,
          color: lesson.color ?? undefined,
          tags: lesson.tags,
          isActive: lesson.isActive,
          status: lesson.status,
          estimatedTime: lesson.estimatedTime ?? undefined,
          blocks: lesson.blocks ?? undefined,
        })),
      })),
      children: [],
    }));
  }
}
