/*
 * Funcionalidad: Repositorio Prisma ModuleProgressPrismaRepository
 * Descripción: Implementa IModuleProgressRepository sobre PrismaService y resolveClient para la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { generateId } from "@/common/domain/utils/generate-id";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ModuleLessonProgress,
  type ModuleProgressView,
  type ModuleResumeSnapshot,
} from "@/features/modules/domain/read-models/module-progress.read-model";
import { type IModuleProgressRepository } from "@/features/modules/domain/repositories/module-progress.repository";

type ProgressModuleRow = Prisma.ModuleGetPayload<{
  select: {
    title: true;
    estimatedTime: true;
    _count: { select: { lessons: true } };
    lessons: { select: { id: true; title: true; order: true; estimatedTime: true } };
  };
}>;

type ResumeModuleRow = Prisma.ModuleGetPayload<{
  select: {
    id: true;
    title: true;
    lessons: { select: { id: true; title: true; order: true; _count: { select: { steps: true } } } };
  };
}>;

type LessonCompletionRow = { lessonId: string; isCompleted: boolean; timeSpent: number; lastAccessed: Date | null };

@Injectable()
export class ModuleProgressPrismaRepository implements IModuleProgressRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getProgressEnsuringRecord(userId: string, moduleId: string): Promise<ModuleProgressView | undefined> {
    const module: ProgressModuleRow | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        title: true,
        estimatedTime: true,
        _count: { select: { lessons: true } },
        lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, estimatedTime: true } },
      },
    });

    if (!module) {
      return undefined;
    }

    const progress: { id: string; completedAt: Date | null; timeSpent: number } = await this._prisma.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {},
      create: { id: generateId(), userId, moduleId, timeSpent: 0 },
      select: { id: true, completedAt: true, timeSpent: true },
    });

    const completions: LessonCompletionRow[] = await this._prisma.lessonCompletion.findMany({
      where: { userId, lessonId: { in: module.lessons.map((lesson: { id: string }) => lesson.id) } },
      select: { lessonId: true, isCompleted: true, timeSpent: true, lastAccessed: true },
    });

    const completionByLesson: Map<string, LessonCompletionRow> = new Map(
      completions.map((completion: LessonCompletionRow): [string, LessonCompletionRow] => [completion.lessonId, completion]),
    );

    const lessonProgress: ModuleLessonProgress[] = module.lessons.map((lesson: ProgressModuleRow["lessons"][number]) => {
      const completion: LessonCompletionRow | undefined = completionByLesson.get(lesson.id);

      return {
        lesson: { id: lesson.id, title: lesson.title, order: lesson.order, estimatedTime: lesson.estimatedTime ?? undefined },
        completed: completion?.isCompleted ?? false,
        timeSpent: completion?.timeSpent ?? 0,
        lastAccessed: completion?.lastAccessed ?? undefined,
      };
    });

    const totalLessons: number = module._count.lessons;
    const completedLessons: number = lessonProgress.filter((item: ModuleLessonProgress) => item.completed).length;

    return {
      progress: { id: progress.id, completedAt: progress.completedAt ?? undefined, timeSpent: progress.timeSpent },
      module: { id: moduleId, title: module.title, estimatedTime: module.estimatedTime ?? undefined },
      statistics: {
        totalLessons,
        completedLessons,
        completionPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        remainingLessons: totalLessons - completedLessons,
      },
      lessonProgress,
    };
  }

  public async getResumeSnapshot(userId: string, moduleId: string): Promise<ModuleResumeSnapshot | undefined> {
    const module: ResumeModuleRow | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        title: true,
        lessons: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, _count: { select: { steps: { where: { isActive: true } } } } },
        },
      },
    });

    if (!module) {
      return undefined;
    }

    const [completions, userProgress] = await Promise.all([
      this._prisma.lessonCompletion.findMany({
        where: { userId, lessonId: { in: module.lessons.map((lesson: { id: string }) => lesson.id) } },
        select: { lessonId: true, isCompleted: true, currentStepIndex: true, totalSteps: true },
      }),
      this._prisma.userProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId } },
        select: { lastAccessedAt: true },
      }),
    ]);

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      lessons: module.lessons.map((lesson: ResumeModuleRow["lessons"][number]) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        activeStepCount: lesson._count.steps,
      })),
      completions,
      lastAccessedAt: userProgress?.lastAccessedAt ?? undefined,
    };
  }
}
