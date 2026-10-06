/*
 * Funcionalidad: Repositorio Prisma SectionQueriesPrismaRepository
 * Descripción: Implementa ISectionQueriesRepository sobre PrismaService; los estudiantes solo ven secciones publicadas y niveles publicados, los gestores ven todo. La lista de niveles por sección es un modelo de lectura sobre la tabla de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { visibleLevelWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { type SectionLevelItem, type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";
import { type ISectionQueriesRepository } from "@/features/sections/domain/repositories/section-queries.repository";

type SectionSummaryRow = Prisma.SectionGetPayload<{ include: { _count: { select: { levels: true } } } }>;

type SectionLevelRow = Prisma.LevelGetPayload<{
  select: { id: true; title: true; description: true; track: true; order: true; status: true; _count: { select: { modules: true } } };
}>;

@Injectable()
export class SectionQueriesPrismaRepository implements ISectionQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getSummaries(canManage: boolean): Promise<SectionSummary[]> {
    const rows: SectionSummaryRow[] = await this._prisma.section.findMany({
      where: canManage ? {} : { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: { _count: { select: { levels: true } } },
    });

    return rows.map((row: SectionSummaryRow) => this._toSummary(row));
  }

  public async getSummary(sectionId: string, canManage: boolean): Promise<SectionSummary | undefined> {
    const row: SectionSummaryRow | null = await this._prisma.section.findFirst({
      where: canManage ? { id: sectionId } : { id: sectionId, status: "PUBLISHED" },
      include: { _count: { select: { levels: true } } },
    });

    return row ? this._toSummary(row) : undefined;
  }

  public async getLevels(sectionId: string, canManage: boolean): Promise<SectionLevelItem[]> {
    const rows: SectionLevelRow[] = await this._prisma.level.findMany({
      where: { AND: [{ sectionId }, visibleLevelWhere(canManage)] },
      orderBy: { order: "asc" },
      select: { id: true, title: true, description: true, track: true, order: true, status: true, _count: { select: { modules: true } } },
    });

    return rows.map((row: SectionLevelRow) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      track: row.track,
      order: row.order,
      status: row.status,
      moduleCount: row._count.modules,
    }));
  }

  private _toSummary(row: SectionSummaryRow): SectionSummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      order: row.order,
      status: row.status,
      levelCount: row._count.levels,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
