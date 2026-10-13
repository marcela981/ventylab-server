/*
 * Funcionalidad: Pruebas del catálogo de logros
 * Descripción: Verifica el XP de los logros por título, el XP total (lecciones, módulos, quizzes y logros desbloqueados), la racha de días consecutivos (hoy o ayer como último día, días repetidos, racha rota) y la evaluación de cada tipo de condición de desbloqueo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
  type AchievementMetrics,
  calculateAchievementXP,
  calculateCurrentStreak,
  calculateTotalXP,
  getAchievementXPReward,
  meetsAchievementCondition,
} from "@/features/progress/domain/services/achievement-catalog";

const TODAY: Date = new Date(2026, 9, 12, 15, 30);

function daysAgo(days: number, hour: number = 10): Date {
  return new Date(2026, 9, 12 - days, hour, 0);
}

function metrics(overrides: Partial<AchievementMetrics> = {}): AchievementMetrics {
  return { completedLessons: 0, completedModules: 0, passedQuizzes: 0, perfectQuizzes: 0, activityDates: [], ...overrides };
}

function definition(id: string): AchievementDefinition {
  const found: AchievementDefinition | undefined = ACHIEVEMENT_DEFINITIONS.find((candidate: AchievementDefinition): boolean => candidate.id === id);

  if (!found) {
    throw new Error(`Unknown achievement ${id}`);
  }

  return found;
}

describe("achievement catalog", () => {
  describe("XP", () => {
    it("returns the reward of a known title and zero for an unknown one", () => {
      expect(getAchievementXPReward("Primer Paso")).toBe(50);
      expect(getAchievementXPReward("Not an achievement")).toBe(0);
    });

    it("adds the rewards of every unlocked title", () => {
      expect(calculateAchievementXP(["Primer Paso", "Módulo Completado", "Unknown"])).toBe(350);
    });

    it("adds lessons, modules, passed quizzes and achievement rewards", () => {
      const total: number = calculateTotalXP(metrics({ completedLessons: 3, completedModules: 1, passedQuizzes: 2 }), ["Primer Paso"]);

      expect(total).toBe(3 * 50 + 200 + 2 * 100 + 50);
    });
  });

  describe("current streak", () => {
    it("is zero without activity", () => {
      expect(calculateCurrentStreak([], TODAY)).toBe(0);
    });

    it("counts consecutive days ending today, ignoring repeated activity on one day", () => {
      const dates: Date[] = [daysAgo(0, 8), daysAgo(0, 20), daysAgo(1), daysAgo(2)];

      expect(calculateCurrentStreak(dates, TODAY)).toBe(3);
    });

    it("keeps a streak whose last day is yesterday", () => {
      expect(calculateCurrentStreak([daysAgo(1), daysAgo(2), daysAgo(3)], TODAY)).toBe(3);
    });

    it("stops at the first missing day", () => {
      expect(calculateCurrentStreak([daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)], TODAY)).toBe(2);
    });

    it("is zero when the last activity is older than yesterday", () => {
      expect(calculateCurrentStreak([daysAgo(2), daysAgo(3)], TODAY)).toBe(0);
    });
  });

  describe("unlock conditions", () => {
    it.each<[string, Partial<AchievementMetrics>, Partial<AchievementMetrics>]>([
      ["first_lesson", { completedLessons: 1 }, { completedLessons: 0 }],
      ["first_module", { completedModules: 1 }, { completedModules: 0 }],
      ["quiz_master", { passedQuizzes: 10 }, { passedQuizzes: 9 }],
      ["perfect_quiz", { perfectQuizzes: 1 }, { perfectQuizzes: 0 }],
    ])("evaluates %s against its threshold", (id: string, reached: Partial<AchievementMetrics>, missed: Partial<AchievementMetrics>) => {
      expect(meetsAchievementCondition(definition(id), metrics(reached), [], TODAY)).toBe(true);
      expect(meetsAchievementCondition(definition(id), metrics(missed), [], TODAY)).toBe(false);
    });

    it("evaluates a streak condition with the current streak", () => {
      const week: Date[] = Array.from({ length: 7 }, (_value: unknown, index: number): Date => daysAgo(index));

      expect(meetsAchievementCondition(definition("week_streak"), metrics({ activityDates: week }), [], TODAY)).toBe(true);
      expect(meetsAchievementCondition(definition("week_streak"), metrics({ activityDates: week.slice(0, 6) }), [], TODAY)).toBe(false);
    });

    it("counts the rewards of already unlocked achievements towards an XP condition", () => {
      const nearLevel10: AchievementMetrics = metrics({ completedLessons: 90, completedModules: 2 });

      expect(meetsAchievementCondition(definition("level_10"), nearLevel10, [], TODAY)).toBe(false);
      expect(meetsAchievementCondition(definition("level_10"), nearLevel10, ["Racha Mensual"], TODAY)).toBe(true);
    });

    it("never meets a condition of an unknown type", () => {
      const unknown: AchievementDefinition = { ...definition("first_lesson"), condition: { type: "unknown" as never, value: 0 } };

      expect(meetsAchievementCondition(unknown, metrics({ completedLessons: 100 }), [], TODAY)).toBe(false);
    });
  });
});
