/*
 * Funcionalidad: Repositorio Prisma de progreso
 * Descripción: Implementa IProgressRepository sobre las tablas UserProgress y LessonCompletion con Prisma (upserts con incrementos, mejores puntajes y recálculo de contadores por módulo con la regla de completitud por páginas, sin reiniciar completedAt de un módulo ya completado); depende de PrismaService y loadLessonCompletionFacts
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type LessonCompletion as LessonCompletionModel, type Prisma, type UserProgress as UserProgressModel } from "@prisma/client";

import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { summarizeLessons } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { loadLessonCompletionFacts } from "@/features/curriculum/infrastructure/persistence/prisma/lesson-completion-facts";
import {
  type LessonCompletionSnapshot,
  type LessonCompletionWrite,
  type ModuleAccessWrite,
  type ModuleCounters,
  type ModuleCountersRefresh,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";
import { computeModuleCounters } from "@/features/progress/domain/services/module-progress-calculator";
import { IN_PROGRESS_PROGRESS_STATUS, NOT_STARTED_PROGRESS_STATUS } from "@/features/progress/domain/value-objects/progress-status";
import { ProgressMapper } from "@/features/progress/infrastructure/persistence/prisma/mappers/progress.mapper";

@Injectable()
export class ProgressPrismaRepository implements IProgressRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getModuleProgress(userId: string, moduleId: string, transaction?: unknown): Promise<ModuleProgressSnapshot | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: UserProgressModel | null = await client.userProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });

    return row ? ProgressMapper.toModuleProgressSnapshot(row) : undefined;
  }

  public async getModuleProgresses(userId: string, moduleIds?: string[]): Promise<ModuleProgressSnapshot[]> {
    const rows: UserProgressModel[] = await this._prisma.userProgress.findMany({
      where: { userId, ...(moduleIds ? { moduleId: { in: moduleIds } } : {}) },
    });

    return rows.map((row: UserProgressModel) => ProgressMapper.toModuleProgressSnapshot(row));
  }

  public async ensureModuleProgress(userId: string, moduleId: string): Promise<ModuleProgressSnapshot> {
    const row: UserProgressModel = await this._prisma.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {},
      create: { id: generateId(), userId, moduleId, status: NOT_STARTED_PROGRESS_STATUS },
    });

    return ProgressMapper.toModuleProgressSnapshot(row);
  }

  public async getLessonCompletion(userId: string, lessonId: string, transaction?: unknown): Promise<LessonCompletionSnapshot | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: LessonCompletionModel | null = await client.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return row ? ProgressMapper.toLessonCompletionSnapshot(row) : undefined;
  }

  public async getLessonCompletions(userId: string, lessonIds?: string[]): Promise<LessonCompletionSnapshot[]> {
    const rows: LessonCompletionModel[] = await this._prisma.lessonCompletion.findMany({
      where: { userId, ...(lessonIds ? { lessonId: { in: lessonIds } } : {}) },
    });

    return rows.map((row: LessonCompletionModel) => ProgressMapper.toLessonCompletionSnapshot(row));
  }

  public async saveLessonCompletion(write: LessonCompletionWrite, transaction?: unknown): Promise<LessonCompletionSnapshot> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const now: Date = new Date();

    const update: Prisma.LessonCompletionUncheckedUpdateInput = {
      timeSpent: { increment: write.timeSpentDelta },
      lastAccessed: now,
      isCompleted: write.isCompleted,
    };

    const create: Prisma.LessonCompletionUncheckedCreateInput = {
      id: generateId(),
      userId: write.userId,
      lessonId: write.lessonId,
      timeSpent: write.timeSpentDelta,
      lastAccessed: now,
      isCompleted: write.isCompleted,
      completedAt: write.stampCompletedAt ? now : null,
    };

    if (write.stampCompletedAt) {
      update.completedAt = now;
    }

    if (write.currentStepIndex !== undefined) {
      update.currentStepIndex = write.currentStepIndex;
      create.currentStepIndex = write.currentStepIndex;
    }

    if (write.totalSteps !== undefined) {
      update.totalSteps = write.totalSteps;
      create.totalSteps = write.totalSteps;
    }

    if (write.quizScore) {
      update.bestQuizScore = write.quizScore.best;
      update.lastQuizScore = write.quizScore.last;
      update.quizAttempts = { increment: 1 };
      create.bestQuizScore = write.quizScore.last;
      create.lastQuizScore = write.quizScore.last;
      create.quizAttempts = 1;
    }

    const row: LessonCompletionModel = await client.lessonCompletion.upsert({
      where: { userId_lessonId: { userId: write.userId, lessonId: write.lessonId } },
      update,
      create,
    });

    return ProgressMapper.toLessonCompletionSnapshot(row);
  }

  public async touchModuleAccess(write: ModuleAccessWrite, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const now: Date = new Date();

    await client.userProgress.upsert({
      where: { userId_moduleId: { userId: write.userId, moduleId: write.moduleId } },
      update: {
        lastAccessedLessonId: write.lessonId,
        lastAccessedAt: now,
        timeSpent: { increment: write.timeSpentDelta },
        ...(write.markInProgress ? { status: IN_PROGRESS_PROGRESS_STATUS } : {}),
      },
      create: {
        id: generateId(),
        userId: write.userId,
        moduleId: write.moduleId,
        status: IN_PROGRESS_PROGRESS_STATUS,
        lastAccessedLessonId: write.lessonId,
        lastAccessedAt: now,
        timeSpent: write.timeSpentDelta,
      },
    });
  }

  public async refreshModuleCounters(refresh: ModuleCountersRefresh, transaction?: unknown): Promise<ModuleCounters | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const facts: LessonCompletionFact[] = await loadLessonCompletionFacts(client, refresh.userId, { moduleId: refresh.moduleId });

    if (facts.length === 0) {
      return undefined;
    }

    const now: Date = new Date();
    const summary: LessonWeightedProgress = summarizeLessons(facts);
    const counters: ModuleCounters = computeModuleCounters(summary.completedLessons, summary.totalLessons);
    const timeSpentDelta: number = refresh.timeSpentDelta ?? 0;

    const existing: { completedAt: Date | null } | null = await client.userProgress.findUnique({
      where: { userId_moduleId: { userId: refresh.userId, moduleId: refresh.moduleId } },
      select: { completedAt: true },
    });

    const completedAt: Date | null = counters.isModuleCompleted ? (existing?.completedAt ?? now) : null;

    const fields: Prisma.UserProgressUncheckedUpdateInput = {
      status: counters.status,
      isModuleCompleted: counters.isModuleCompleted,
      completedLessonsCount: counters.completedLessonsCount,
      totalLessons: counters.totalLessons,
      progressPercentage: counters.progressPercentage,
      lastAccessedAt: now,
      completedAt,
      ...(refresh.lastAccessedLessonId ? { lastAccessedLessonId: refresh.lastAccessedLessonId } : {}),
    };

    await client.userProgress.upsert({
      where: { userId_moduleId: { userId: refresh.userId, moduleId: refresh.moduleId } },
      update: { ...fields, timeSpent: { increment: timeSpentDelta } },
      create: {
        id: generateId(),
        userId: refresh.userId,
        moduleId: refresh.moduleId,
        status: counters.status,
        isModuleCompleted: counters.isModuleCompleted,
        completedLessonsCount: counters.completedLessonsCount,
        totalLessons: counters.totalLessons,
        progressPercentage: counters.progressPercentage,
        lastAccessedAt: now,
        completedAt,
        lastAccessedLessonId: refresh.lastAccessedLessonId ?? null,
        timeSpent: timeSpentDelta,
      },
    });

    return counters;
  }
}
