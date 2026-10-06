/*
 * Funcionalidad: Repositorio Prisma LessonProgressPrismaRepository
 * Descripción: Implementa ILessonProgressRepository sobre PrismaService y resolveClient para la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type LessonCompletion as LessonCompletionModel, ProgressStatus, type UserProgress as UserProgressModel } from "@prisma/client";

import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type LessonCompletionRecord,
  type LessonCompletionResult,
  type ModuleProgressRecord,
} from "@/features/lessons/domain/read-models/lesson-progress.read-model";
import { type ILessonProgressRepository } from "@/features/lessons/domain/repositories/lesson-progress.repository";

@Injectable()
export class LessonProgressPrismaRepository implements ILessonProgressRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async markCompleted(
    { userId, lessonId, moduleId, timeSpent }: { userId: string; lessonId: string; moduleId: string; timeSpent: number },
    transaction?: unknown,
  ): Promise<LessonCompletionResult> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const now: Date = new Date();

    const lessonCompletion: LessonCompletionModel = await client.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { isCompleted: true, completedAt: now, timeSpent: { increment: timeSpent }, lastAccessed: now },
      create: { id: generateId(), userId, lessonId, isCompleted: true, completedAt: now, timeSpent, lastAccessed: now },
    });

    const moduleLessons: { id: string }[] = await client.lesson.findMany({ where: { moduleId }, select: { id: true } });
    const totalLessons: number = moduleLessons.length;

    const completedLessons: number = await client.lessonCompletion.count({
      where: { userId, lessonId: { in: moduleLessons.map((lesson: { id: string }) => lesson.id) }, isCompleted: true },
    });

    const moduleCompleted: boolean = completedLessons === totalLessons;
    const progressPercentage: number = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const status: ProgressStatus = moduleCompleted ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;

    const moduleProgress: UserProgressModel = await client.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {
        timeSpent: { increment: timeSpent },
        completedLessonsCount: completedLessons,
        totalLessons,
        progressPercentage,
        isModuleCompleted: moduleCompleted,
        status,
        ...(moduleCompleted ? { completedAt: now } : {}),
        lastAccessedAt: now,
      },
      create: {
        id: generateId(),
        userId,
        moduleId,
        timeSpent,
        completedLessonsCount: completedLessons,
        totalLessons,
        progressPercentage,
        isModuleCompleted: moduleCompleted,
        status,
        ...(moduleCompleted ? { completedAt: now } : {}),
      },
    });

    return {
      lessonProgress: this._toCompletionRecord(lessonCompletion),
      moduleCompleted,
      moduleProgress: this._toModuleProgressRecord(moduleProgress),
    };
  }

  public async recordAccess(
    { userId, lessonId, moduleId }: { userId: string; lessonId: string; moduleId: string },
    transaction?: unknown,
  ): Promise<LessonCompletionRecord> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const now: Date = new Date();

    await client.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { lastAccessedAt: now, lastAccessedLessonId: lessonId },
      create: { id: generateId(), userId, moduleId, timeSpent: 0, lastAccessedLessonId: lessonId },
    });

    const lessonCompletion: LessonCompletionModel = await client.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { lastAccessed: now },
      create: { id: generateId(), userId, lessonId, isCompleted: false, timeSpent: 0, lastAccessed: now },
    });

    return this._toCompletionRecord(lessonCompletion);
  }

  private _toCompletionRecord(row: LessonCompletionModel): LessonCompletionRecord {
    return {
      id: row.id,
      userId: row.userId,
      lessonId: row.lessonId,
      currentStepIndex: row.currentStepIndex,
      totalSteps: row.totalSteps,
      timeSpent: row.timeSpent,
      lastAccessed: row.lastAccessed ?? undefined,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  private _toModuleProgressRecord(row: UserProgressModel): ModuleProgressRecord {
    return {
      id: row.id,
      userId: row.userId,
      moduleId: row.moduleId,
      status: row.status,
      isModuleCompleted: row.isModuleCompleted,
      completedLessonsCount: row.completedLessonsCount,
      totalLessons: row.totalLessons,
      progressPercentage: row.progressPercentage,
      timeSpent: row.timeSpent,
      lastAccessedLessonId: row.lastAccessedLessonId ?? undefined,
      lastAccessedAt: row.lastAccessedAt,
      completedAt: row.completedAt ?? undefined,
    };
  }
}
