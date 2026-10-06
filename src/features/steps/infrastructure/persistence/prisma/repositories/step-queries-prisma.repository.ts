/*
 * Funcionalidad: Repositorio Prisma StepQueriesPrismaRepository
 * Descripción: Implementa IStepQueriesRepository sobre PrismaService y resolveClient para la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma, type Step as StepModel } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type StepDetail, type StepListItem, type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";
import {
  type GetStepsQuery,
  type IStepQueriesRepository,
  type StepNeighborDirection,
} from "@/features/steps/domain/repositories/step-queries.repository";
import { StepsMapper } from "@/features/steps/infrastructure/persistence/prisma/mappers/steps.mapper";

type StepListRow = Prisma.StepGetPayload<{ include: { lesson: { select: { id: true; title: true; moduleId: true } } } }>;

type StepDetailRow = Prisma.StepGetPayload<{
  include: {
    lesson: {
      select: { id: true; title: true; moduleId: true; module: { select: { id: true; title: true; levelId: true } } };
    };
  };
}>;

@Injectable()
export class StepQueriesPrismaRepository implements IStepQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getList(query: GetStepsQuery): Promise<Paginated<StepListItem>> {
    const { page, limit, lessonId, includeInactive } = query;

    const where: Prisma.StepWhereInput = {};

    if (lessonId) where.lessonId = lessonId;
    if (!includeInactive) where.isActive = true;

    const [rows, total] = await Promise.all([
      this._prisma.step.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { lesson: { select: { id: true, title: true, moduleId: true } } },
      }),
      this._prisma.step.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: StepListRow) => ({
        ...StepsMapper.toSummary(row),
        lesson: { id: row.lesson.id, title: row.lesson.title, moduleId: row.lesson.moduleId },
      })),
      total,
      page,
      limit,
    });
  }

  public async getDetail(stepId: string): Promise<StepDetail | undefined> {
    const row: StepDetailRow | null = await this._prisma.step.findUnique({
      where: { id: stepId },
      include: {
        lesson: {
          select: { id: true, title: true, moduleId: true, module: { select: { id: true, title: true, levelId: true } } },
        },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      ...StepsMapper.toSummary(row),
      lesson: {
        id: row.lesson.id,
        title: row.lesson.title,
        moduleId: row.lesson.moduleId,
        module: { id: row.lesson.module.id, title: row.lesson.module.title, levelId: row.lesson.module.levelId ?? undefined },
      },
    };
  }

  public async getActiveNeighbor(lessonId: string, order: number, direction: StepNeighborDirection): Promise<StepSummary | undefined> {
    const isNext: boolean = direction === "next";

    const row: StepModel | null = await this._prisma.step.findFirst({
      where: { lessonId, isActive: true, order: isNext ? { gt: order } : { lt: order } },
      orderBy: { order: isNext ? "asc" : "desc" },
    });

    return row ? StepsMapper.toSummary(row) : undefined;
  }
}
