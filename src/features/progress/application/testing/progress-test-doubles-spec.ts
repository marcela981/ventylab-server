/*
 * Funcionalidad: Dobles de prueba del progreso de aprendizaje
 * Descripción: Construye repositorios simulados con jest (progreso, consultas de progreso, progreso por páginas y logros), un gestor de transacciones que ejecuta el trabajo con una transacción ficticia, un bus de eventos que registra lo publicado y registros de lección de ejemplo, compartidos por las pruebas de los casos de uso del progreso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import {
  type LessonCompletionSnapshot,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import { type ILearningProgressRepository } from "@/features/progress/domain/repositories/learning-progress.repository";
import { type IProgressQueriesRepository } from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";

export const TEST_TRANSACTION: string = "tx";
export const ACCESSED_AT: Date = new Date("2026-10-10T12:00:00.000Z");

export function buildProgressRepository(): jest.Mocked<IProgressRepository> {
  return {
    getModuleProgress: jest.fn().mockResolvedValue(undefined),
    getModuleProgresses: jest.fn().mockResolvedValue([]),
    ensureModuleProgress: jest.fn().mockImplementation((_userId: string, moduleId: string): Promise<ModuleProgressSnapshot> => Promise.resolve(moduleProgress(moduleId))),
    getLessonCompletion: jest.fn().mockResolvedValue(undefined),
    getLessonCompletions: jest.fn().mockResolvedValue([]),
    saveLessonCompletion: jest.fn().mockImplementation((write: { lessonId: string }): Promise<LessonCompletionSnapshot> => Promise.resolve(lessonCompletion(write.lessonId))),
    touchModuleAccess: jest.fn().mockResolvedValue(undefined),
    refreshModuleCounters: jest.fn().mockResolvedValue(undefined),
  };
}

export function buildProgressQueriesRepository(): jest.Mocked<IProgressQueriesRepository> {
  return {
    resolveLessonReference: jest.fn().mockResolvedValue({ moduleId: "M1", lessonId: "L1" }),
    isActiveModule: jest.fn().mockResolvedValue(true),
    moduleExists: jest.fn().mockResolvedValue(true),
    getActiveLessonIds: jest.fn().mockResolvedValue([]),
    getActiveLessonsByModules: jest.fn().mockResolvedValue([]),
    getLessonGate: jest.fn().mockResolvedValue(undefined),
    getPreviousActiveLessonId: jest.fn().mockResolvedValue(undefined),
    countActiveSteps: jest.fn().mockResolvedValue(undefined),
    getOverviewModules: jest.fn().mockResolvedValue([]),
  };
}

export function buildLearningProgressRepository(): jest.Mocked<ILearningProgressRepository> {
  return {
    getProgressSource: jest.fn().mockResolvedValue(undefined),
    getPageViewTarget: jest.fn().mockResolvedValue(undefined),
    getPageView: jest.fn().mockResolvedValue(undefined),
    savePageView: jest.fn(),
    getLessonFacts: jest.fn().mockResolvedValue([]),
    markLessonCompleted: jest.fn().mockResolvedValue(undefined),
  };
}

export function buildAchievementsRepository(): jest.Mocked<IAchievementsRepository> {
  return {
    getByUserId: jest.fn().mockResolvedValue([]),
    getMetrics: jest.fn().mockResolvedValue({ completedLessons: 0, completedModules: 0, passedEvaluations: 0, perfectEvaluations: 0, currentStreak: 0, xpTotal: 0 }),
    insertIfAbsent: jest.fn().mockResolvedValue(true),
  };
}

export const PASSTHROUGH_TRANSACTION_MANAGER: ITransactionManager = {
  run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TEST_TRANSACTION),
};

export class RecordingEventBus implements IEventBus {
  public readonly published: DomainEvent[] = [];

  public publish(events: DomainEvent[]): void {
    this.published.push(...events);
  }
}

export function lessonCompletion(lessonId: string, overrides: Partial<LessonCompletionSnapshot> = {}): LessonCompletionSnapshot {
  return { lessonId, currentStepIndex: 0, totalSteps: 4, timeSpent: 30, lastAccessed: ACCESSED_AT, isCompleted: false, updatedAt: ACCESSED_AT, ...overrides };
}

export function moduleProgress(moduleId: string, overrides: Partial<ModuleProgressSnapshot> = {}): ModuleProgressSnapshot {
  return {
    moduleId,
    status: "NOT_STARTED",
    isModuleCompleted: false,
    completedLessonsCount: 0,
    totalLessons: 0,
    progressPercentage: 0,
    timeSpent: 0,
    lastAccessedAt: ACCESSED_AT,
    ...overrides,
  };
}
