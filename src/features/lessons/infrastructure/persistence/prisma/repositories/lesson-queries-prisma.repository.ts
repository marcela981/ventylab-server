/*
 * Funcionalidad: Repositorio Prisma LessonQueriesPrismaRepository
 * Descripción: Implementa ILessonQueriesRepository sobre PrismaService y resolveClient para la feature de lecciones; los quizzes de una lección se leen de las evaluaciones QUIZ del alcance de quizzes (lesson_id) y se reconstruyen con QuizzesMapper en la forma JSON heredada, porque la tabla quizzes queda congelada
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma, type Step as StepModel } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import {
  type LessonContentView,
  type LessonDetail,
  type LessonNeighbor,
  type LessonQuizItem,
  type LessonStepItem,
} from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { type ILessonQueriesRepository, type LessonNeighborDirection } from "@/features/lessons/domain/repositories/lesson-queries.repository";
import { LessonsMapper } from "@/features/lessons/infrastructure/persistence/prisma/mappers/lessons.mapper";
import { type QuizDetail } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { type QuizEvaluationRow, QuizzesMapper } from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";
import { QUIZ_EVALUATION_SCOPE } from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";

type LessonDetailRow = Prisma.LessonGetPayload<{ include: { module: true } }>;

type LessonNeighborRow = Prisma.LessonGetPayload<{ include: { module: { select: { id: true; title: true } } } }>;

type LessonStatusRow = Prisma.LessonGetPayload<{
  select: { status: true; module: { select: { status: true; level: { select: { status: true; section: { select: { status: true } } } } } } };
}>;

type LessonStepsRow = Prisma.LessonGetPayload<{ include: { steps: true } }>;

type LessonContentRow = Prisma.LessonGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    color: true;
    tags: true;
    blocks: true;
    estimatedTime: true;
    isActive: true;
    moduleId: true;
    updatedAt: true;
  };
}>;

@Injectable()
export class LessonQueriesPrismaRepository implements ILessonQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getStatusChain(lessonId: string): Promise<ContentStatusChain | undefined> {
    const row: LessonStatusRow | null = await this._prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { status: true, module: { select: { status: true, level: { select: { status: true, section: { select: { status: true } } } } } } },
    });

    return row ? [row.module.level?.section?.status, row.module.level?.status, row.module.status, row.status] : undefined;
  }

  public async getDetail(lessonId: string): Promise<LessonDetail | undefined> {
    const row: LessonDetailRow | null = await this._prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!row) {
      return undefined;
    }

    const quizzes: QuizEvaluationRow[] = await this._findLessonQuizzes(lessonId);

    return {
      ...LessonsMapper.toSummary(row),
      sourcePrompt: row.sourcePrompt ?? undefined,
      blocks: row.blocks ?? undefined,
      module: {
        id: row.module.id,
        levelId: row.module.levelId ?? undefined,
        title: row.module.title,
        difficulty: row.module.difficulty ?? undefined,
        order: row.module.order,
        isActive: row.module.isActive,
      },
      quizzes: quizzes.map((quiz: QuizEvaluationRow) => this._toQuizItem(quiz)),
    };
  }

  public async getNeighbor(moduleId: string, order: number, direction: LessonNeighborDirection, canManage: boolean): Promise<LessonNeighbor | undefined> {
    const isNext: boolean = direction === "next";

    const row: LessonNeighborRow | null = await this._prisma.lesson.findFirst({
      where: { moduleId, order: isNext ? { gt: order } : { lt: order }, ...(canManage ? {} : { status: "PUBLISHED" as const }) },
      orderBy: { order: isNext ? "asc" : "desc" },
      include: { module: { select: { id: true, title: true } } },
    });

    return row ? { ...LessonsMapper.toSummary(row), module: { id: row.module.id, title: row.module.title } } : undefined;
  }

  public async getSteps(lessonId: string, includeInactive: boolean): Promise<LessonStepItem[] | undefined> {
    const row: LessonStepsRow | null = await this._prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { steps: { where: includeInactive ? {} : { isActive: true }, orderBy: { order: "asc" } } },
    });

    if (!row) {
      return undefined;
    }

    return row.steps.map((step: StepModel) => ({
      id: step.id,
      lessonId: step.lessonId,
      title: step.title ?? undefined,
      content: step.content,
      contentType: step.contentType,
      order: step.order,
      isActive: step.isActive,
      lastModifiedBy: step.lastModifiedBy ?? undefined,
      lastModifiedAt: step.lastModifiedAt ?? undefined,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    }));
  }

  public async getContent(lessonId: string): Promise<LessonContentView | undefined> {
    const row: LessonContentRow | null = await this._prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        slug: true,
        color: true,
        tags: true,
        blocks: true,
        estimatedTime: true,
        isActive: true,
        moduleId: true,
        updatedAt: true,
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      title: row.title,
      slug: row.slug ?? undefined,
      color: row.color ?? undefined,
      tags: row.tags,
      blocks: row.blocks ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      isActive: row.isActive,
      moduleId: row.moduleId,
      updatedAt: row.updatedAt,
    };
  }

  private _toQuizItem(row: QuizEvaluationRow): LessonQuizItem {
    const quiz: QuizDetail = QuizzesMapper.toDetail(row);

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      order: quiz.order,
      isActive: quiz.isActive,
    };
  }

  private async _findLessonQuizzes(lessonId: string): Promise<QuizEvaluationRow[]> {
    return await this._prisma.evaluation.findMany({
      where: { AND: [QUIZ_EVALUATION_SCOPE, { lessonId }] },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        moduleId: true,
        lessonId: true,
        durationMinutes: true,
        status: true,
        order: true,
        legacySource: true,
        legacyPassingScore: true,
        legacyModuleRef: true,
        createdAt: true,
        updatedAt: true,
        questions: {
          select: {
            id: true,
            order: true,
            type: true,
            prompt: true,
            points: true,
            explanation: true,
            legacyType: true,
            legacyRef: true,
            options: {
              select: { id: true, order: true, content: true, isCorrect: true, legacyFeedback: true, legacyRef: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }
}
