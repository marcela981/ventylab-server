/*
 * Funcionalidad: Pruebas de los casos de uso de lectura del progreso
 * Descripción: Verifica el acceso a módulos, contenidos y lecciones según el estado de desbloqueo del currículo y la lección anterior, la lista de módulos desbloqueados, el progreso y el detalle de una lección (con y sin registro, módulo inexistente), el resumen general (XP, nivel y racha tomados de las estadísticas de gamificación), los reportes de progreso por página de sección, nivel y módulo (404 cuando no existen) y los catálogos fijos de habilidades e hitos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type UnlockState } from "@/features/curriculum/domain/services/unlock-rules";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import {
  buildLearningProgressRepository,
  buildProgressQueriesRepository,
  buildProgressRepository,
  lessonCompletion,
} from "@/features/progress/application/testing/progress-test-doubles-spec";
import { CheckContentUnlockedUseCase } from "@/features/progress/application/use-cases/check-content-unlocked.usecase";
import { CheckLessonAccessUseCase } from "@/features/progress/application/use-cases/check-lesson-access.usecase";
import { CheckModuleAccessUseCase } from "@/features/progress/application/use-cases/check-module-access.usecase";
import { type GetGamificationStatsUseCase } from "@/features/progress/application/use-cases/get-gamification-stats.usecase";
import { GetLearningProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-learning-progress-summary.usecase";
import { GetLessonProgressDetailsUseCase } from "@/features/progress/application/use-cases/get-lesson-progress-details.usecase";
import { GetLessonProgressUseCase } from "@/features/progress/application/use-cases/get-lesson-progress.usecase";
import { GetLevelLearningProgressUseCase } from "@/features/progress/application/use-cases/get-level-learning-progress.usecase";
import { GetMilestonesUseCase } from "@/features/progress/application/use-cases/get-milestones.usecase";
import { GetModuleLearningProgressUseCase } from "@/features/progress/application/use-cases/get-module-learning-progress.usecase";
import { GetProgressOverviewUseCase } from "@/features/progress/application/use-cases/get-progress-overview.usecase";
import { GetSectionLearningProgressUseCase } from "@/features/progress/application/use-cases/get-section-learning-progress.usecase";
import { GetSkillsUseCase } from "@/features/progress/application/use-cases/get-skills.usecase";
import { GetUnlockedModulesUseCase } from "@/features/progress/application/use-cases/get-unlocked-modules.usecase";
import { type LearningProgressReport, type ProgressSource } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ProgressOverview } from "@/features/progress/domain/read-models/progress-views.read-model";
import { type ILearningProgressRepository } from "@/features/progress/domain/repositories/learning-progress.repository";
import { type IProgressQueriesRepository } from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";
import { MILESTONES_SUMMARY, SKILLS_SUMMARY } from "@/features/progress/domain/services/progress-catalog";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

const LOCKED: UnlockState = { locked: true, missingPrerequisites: [] };
const UNLOCKED: UnlockState = { locked: false, missingPrerequisites: [] };

function unlockUseCase(modules: Record<string, UnlockState>, levels: Record<string, UnlockState> = {}): ComputeCurriculumUnlockUseCase {
  return {
    execute: jest.fn().mockResolvedValue({
      modules: new Map(Object.entries(modules)),
      levels: new Map(Object.entries(levels)),
      completedLevelIds: new Set<string>(),
      completedModuleIds: new Set<string>(),
    }),
  } as unknown as ComputeCurriculumUnlockUseCase;
}

function fact(lessonId: string, moduleId: string, overrides: Partial<LessonCompletionFact> = {}): LessonCompletionFact {
  return { lessonId, moduleId, publishedPageCount: 2, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

const SOURCE: ProgressSource = {
  structure: {
    sections: [{ id: "S1", levelIds: ["LV1"] }],
    levels: [{ id: "LV1", sectionId: "S1", moduleIds: ["M1"] }],
    modules: [{ id: "M1", levelId: "LV1" }],
  },
  facts: [fact("L1", "M1", { viewedPageCount: 2 }), fact("L2", "M1")],
};

describe("curriculum unlock queries", () => {
  it("allows a module or content only when its unlock state exists and is not locked", async () => {
    const unlock: ComputeCurriculumUnlockUseCase = unlockUseCase({ M1: UNLOCKED, M2: LOCKED }, { LV1: UNLOCKED });

    expect(await new CheckModuleAccessUseCase(unlock).execute("U1", "M1")).toBe(true);
    expect(await new CheckModuleAccessUseCase(unlock).execute("U1", "M2")).toBe(false);
    expect(await new CheckModuleAccessUseCase(unlock).execute("U1", "missing")).toBe(false);
    expect(await new CheckContentUnlockedUseCase(unlock).execute("U1", { type: "level", id: "LV1" })).toBe(true);
    expect(await new CheckContentUnlockedUseCase(unlock).execute("U1", { type: "module", id: "M2" })).toBe(false);
  });

  it("lists only the unlocked modules", async () => {
    const unlock: ComputeCurriculumUnlockUseCase = unlockUseCase({ M1: UNLOCKED, M2: LOCKED, M3: UNLOCKED });

    expect(await new GetUnlockedModulesUseCase(unlock).execute("U1")).toEqual({ unlockedModuleIds: ["M1", "M3"], count: 2 });
  });
});

describe("CheckLessonAccessUseCase", () => {
  function build(modules: Record<string, UnlockState>): { useCase: CheckLessonAccessUseCase; learning: jest.Mocked<ILearningProgressRepository>; queries: jest.Mocked<IProgressQueriesRepository> } {
    const learning: jest.Mocked<ILearningProgressRepository> = buildLearningProgressRepository();
    const queries: jest.Mocked<IProgressQueriesRepository> = buildProgressQueriesRepository();

    queries.getLessonGate.mockResolvedValue({ lessonId: "L2", moduleId: "M1", order: 2, moduleIsActive: true });

    return { learning, queries, useCase: new CheckLessonAccessUseCase(learning, queries, new CheckModuleAccessUseCase(unlockUseCase(modules))) };
  }

  it("denies a missing lesson, an inactive module or a locked module", async () => {
    const { useCase, queries } = build({ M1: LOCKED });

    expect(await useCase.execute("U1", "L2")).toBe(false);

    queries.getLessonGate.mockResolvedValueOnce(undefined);
    expect(await useCase.execute("U1", "L2")).toBe(false);

    queries.getLessonGate.mockResolvedValueOnce({ lessonId: "L2", moduleId: "M1", order: 2, moduleIsActive: false });
    expect(await useCase.execute("U1", "L2")).toBe(false);
  });

  it("allows the first lesson of an unlocked module", async () => {
    const { useCase } = build({ M1: UNLOCKED });

    expect(await useCase.execute("U1", "L2")).toBe(true);
  });

  it("requires the previous lesson to be completed", async () => {
    const { useCase, queries, learning } = build({ M1: UNLOCKED });

    queries.getPreviousActiveLessonId.mockResolvedValue("L1");
    learning.getLessonFacts.mockResolvedValueOnce([fact("L1", "M1", { viewedPageCount: 1 })]).mockResolvedValueOnce([fact("L1", "M1", { hasCompletionRecord: true })]);

    expect(await useCase.execute("U1", "L2")).toBe(false);
    expect(await useCase.execute("U1", "L2")).toBe(true);
    expect(learning.getLessonFacts).toHaveBeenCalledWith("U1", ["L1"]);
  });

  it("allows the lesson when the previous lesson has no facts", async () => {
    const { useCase, queries } = build({ M1: UNLOCKED });

    queries.getPreviousActiveLessonId.mockResolvedValue("L1");

    expect(await useCase.execute("U1", "L2")).toBe(true);
  });
});

describe("lesson progress reads", () => {
  let progress: jest.Mocked<IProgressRepository>;
  let queries: jest.Mocked<IProgressQueriesRepository>;

  beforeEach(() => {
    progress = buildProgressRepository();
    queries = buildProgressQueriesRepository();
  });

  it("returns an empty view for an unresolved lesson reference without creating module progress", async () => {
    queries.resolveLessonReference.mockResolvedValue(undefined);

    const view: Awaited<ReturnType<GetLessonProgressUseCase["execute"]>> = await new GetLessonProgressUseCase(progress, queries).execute("U1", "unknown");

    expect(view).toMatchObject({ lessonId: "unknown", completed: false, completionPercentage: 0 });
    expect(progress.ensureModuleProgress).not.toHaveBeenCalled();
  });

  it("ensures the module progress and renders the stored lesson under the requested reference", async () => {
    progress.getLessonCompletion.mockResolvedValue(lessonCompletion("L1", { currentStepIndex: 1, totalSteps: 4 }));

    const view: Awaited<ReturnType<GetLessonProgressUseCase["execute"]>> = await new GetLessonProgressUseCase(progress, queries).execute("U1", "lesson-slug", "M1");

    expect(progress.ensureModuleProgress).toHaveBeenCalledWith("U1", "M1");
    expect(view).toMatchObject({ lessonId: "lesson-slug", completionPercentage: 50, currentStep: 2 });
  });

  it("rejects lesson details of a missing module", async () => {
    queries.moduleExists.mockResolvedValue(false);

    await expect(new GetLessonProgressDetailsUseCase(progress, queries).execute("U1", "ghost", "L1")).rejects.toBeInstanceOf(ModuleNotFoundError);
  });

  it("details an untouched lesson with its active step count, or one step when unknown", async () => {
    queries.countActiveSteps.mockResolvedValueOnce(6).mockResolvedValueOnce(undefined);

    const useCase: GetLessonProgressDetailsUseCase = new GetLessonProgressDetailsUseCase(progress, queries);

    expect(await useCase.execute("U1", "M1", "L1")).toEqual({ lessonId: "L1", currentStepIndex: 0, totalSteps: 6, completed: false, timeSpent: 0, progressPercentage: 0 });
    expect((await useCase.execute("U1", "M1", "L1")).totalSteps).toBe(1);
  });

  it("details a stored lesson with its step percentage", async () => {
    progress.getLessonCompletion.mockResolvedValue(lessonCompletion("L1", { currentStepIndex: 2, totalSteps: 4, timeSpent: 75 }));

    const details: Awaited<ReturnType<GetLessonProgressDetailsUseCase["execute"]>> = await new GetLessonProgressDetailsUseCase(progress, queries).execute("U1", "M1", "L1");

    expect(details).toMatchObject({ currentStepIndex: 2, totalSteps: 4, completed: false, timeSpent: 75, progressPercentage: 75 });
  });
});

describe("progress reports", () => {
  it("builds the overview from the default track modules, page facts and lesson records", async () => {
    const progress: jest.Mocked<IProgressRepository> = buildProgressRepository();
    const queries: jest.Mocked<IProgressQueriesRepository> = buildProgressQueriesRepository();
    const learning: jest.Mocked<ILearningProgressRepository> = buildLearningProgressRepository();

    queries.getOverviewModules.mockResolvedValue([{ id: "M1", title: "Module 1", order: 1, lessonIds: ["L1", "L2"] }]);
    learning.getLessonFacts.mockResolvedValue(SOURCE.facts);

    const gamification: { execute: jest.Mock } = {
      execute: jest.fn().mockResolvedValue({ xpTotal: 555, level: 2, xpIntoLevel: 55, nextLevelXp: 1000, streakDays: 3, longestStreak: 4, xpToday: 5 }),
    };
    const overview: ProgressOverview = await new GetProgressOverviewUseCase(
      progress,
      queries,
      learning,
      gamification as unknown as GetGamificationStatsUseCase,
    ).execute("U1");

    expect(learning.getLessonFacts).toHaveBeenCalledWith("U1", ["L1", "L2"]);
    expect(progress.getLessonCompletions).toHaveBeenCalledWith("U1", ["L1", "L2"]);
    expect(overview.stats).toMatchObject({ completedLessons: 1, totalLessons: 2, xpTotal: 555, level: 2, nextLevelXp: 1000, streakDays: 3 });
    expect(gamification.execute).toHaveBeenCalledWith("U1");
  });

  it("reports an empty summary when there is no progress source", async () => {
    const report: LearningProgressReport = await new GetLearningProgressSummaryUseCase(buildLearningProgressRepository()).execute("U1");

    expect([report.sections, report.levels, report.modules]).toEqual([[], [], []]);
  });

  it("reports the section, level and module progress of an existing scope", async () => {
    const learning: jest.Mocked<ILearningProgressRepository> = buildLearningProgressRepository();

    learning.getProgressSource.mockResolvedValue(SOURCE);

    const section: Awaited<ReturnType<GetSectionLearningProgressUseCase["execute"]>> = await new GetSectionLearningProgressUseCase(learning).execute("U1", "S1");
    const level: Awaited<ReturnType<GetLevelLearningProgressUseCase["execute"]>> = await new GetLevelLearningProgressUseCase(learning).execute("U1", "LV1");
    const module: Awaited<ReturnType<GetModuleLearningProgressUseCase["execute"]>> = await new GetModuleLearningProgressUseCase(learning).execute("U1", "M1");
    const summary: LearningProgressReport = await new GetLearningProgressSummaryUseCase(learning).execute("U1");

    expect(learning.getProgressSource).toHaveBeenCalledWith("U1", { type: "section", id: "S1" });
    expect(learning.getProgressSource).toHaveBeenCalledWith("U1", { type: "level", id: "LV1" });
    expect(learning.getProgressSource).toHaveBeenCalledWith("U1", { type: "module", id: "M1" });
    expect([section.sectionId, level.levelId, module.moduleId]).toEqual(["S1", "LV1", "M1"]);
    expect(summary.modules).toHaveLength(1);
  });

  it("answers not found for a section, level or module without a progress source", async () => {
    const learning: jest.Mocked<ILearningProgressRepository> = buildLearningProgressRepository();

    await expect(new GetSectionLearningProgressUseCase(learning).execute("U1", "S9")).rejects.toBeInstanceOf(SectionNotFoundError);
    await expect(new GetLevelLearningProgressUseCase(learning).execute("U1", "LV9")).rejects.toBeInstanceOf(LevelNotFoundError);
    await expect(new GetModuleLearningProgressUseCase(learning).execute("U1", "M9")).rejects.toBeInstanceOf(ModuleNotFoundError);
  });

  it("serves the fixed skills and milestones catalogs", () => {
    expect(new GetSkillsUseCase().execute()).toBe(SKILLS_SUMMARY);
    expect(new GetMilestonesUseCase().execute()).toBe(MILESTONES_SUMMARY);
  });
});
