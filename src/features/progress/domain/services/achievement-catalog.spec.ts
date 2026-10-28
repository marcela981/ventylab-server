/*
 * Funcionalidad: Pruebas del catálogo de logros
 * Descripción: Verifica que cada logro tenga un código único y estable, que los antiguos logros de quiz dependan de evaluaciones, que los de nivel usen la fórmula única ⌊xp/500⌋+1 (nivel 10 con 4500 XP, nivel 25 con 12000) y el cumplimiento de cada tipo de condición en su umbral y justo debajo
 * Versión: 2.0
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
  findAchievementDefinition,
  meetsAchievementCondition,
} from "@/features/progress/domain/services/achievement-catalog";
import { xpForLevel } from "@/features/progress/domain/services/gamification-rules";

const NO_METRICS: AchievementMetrics = { completedLessons: 0, completedModules: 0, passedEvaluations: 0, perfectEvaluations: 0, currentStreak: 0, xpTotal: 0 };

function definition(code: string): AchievementDefinition {
  const found: AchievementDefinition | undefined = findAchievementDefinition(code);

  if (!found) {
    throw new Error(`Unknown achievement ${code}`);
  }

  return found;
}

describe("achievement catalog", () => {
  it("gives every achievement a unique code and a positive reward", () => {
    const codes: string[] = ACHIEVEMENT_DEFINITIONS.map((item: AchievementDefinition) => item.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(ACHIEVEMENT_DEFINITIONS.every((item: AchievementDefinition) => item.xpReward > 0)).toBe(true);
    expect(findAchievementDefinition("missing")).toBeUndefined();
  });

  it("ties the former quiz achievements to evaluations", () => {
    expect(definition("quiz_master").condition).toEqual({ type: "evaluations_passed", value: 10 });
    expect(definition("perfect_quiz").condition).toEqual({ type: "perfect_score", value: 1 });
  });

  it.each([
    ["first_lesson", { completedLessons: 1 }, { completedLessons: 0 }],
    ["ten_lessons", { completedLessons: 10 }, { completedLessons: 9 }],
    ["first_module", { completedModules: 1 }, { completedModules: 0 }],
    ["quiz_master", { passedEvaluations: 10 }, { passedEvaluations: 9 }],
    ["perfect_quiz", { perfectEvaluations: 1 }, { perfectEvaluations: 0 }],
    ["week_streak", { currentStreak: 7 }, { currentStreak: 6 }],
    ["month_streak", { currentStreak: 30 }, { currentStreak: 29 }],
    ["level_10", { xpTotal: xpForLevel(10) }, { xpTotal: xpForLevel(10) - 1 }],
    ["level_25", { xpTotal: xpForLevel(25) }, { xpTotal: xpForLevel(25) - 1 }],
  ])("%s is met at its threshold and not below it", (code: string, met: Partial<AchievementMetrics>, notMet: Partial<AchievementMetrics>) => {
    expect(meetsAchievementCondition(definition(code), { ...NO_METRICS, ...met })).toBe(true);
    expect(meetsAchievementCondition(definition(code), { ...NO_METRICS, ...notMet })).toBe(false);
  });

  it("uses the single level formula: level 10 at 4500 XP and level 25 at 12000 XP", () => {
    expect([xpForLevel(10), xpForLevel(25)]).toEqual([4500, 12000]);
  });
});
