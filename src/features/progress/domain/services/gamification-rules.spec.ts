/*
 * Funcionalidad: Pruebas de las reglas de gamificación
 * Descripción: Verifica el XP por tipo de actividad (logro con su recompensa, nunca negativa), los umbrales de nivel ⌊xp/500⌋+1 (499, 500, 999, 1000) con el XP dentro del nivel y el del siguiente, el XP de un nivel, la racha actual que termina hoy o ayer, los huecos que la cortan, la racha más larga, los días repetidos y futuros, y el armado de las estadísticas
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  buildGamificationStats,
  computeLevel,
  computeStreaks,
  xpForActivity,
  xpForLevel,
} from "@/features/progress/domain/services/gamification-rules";

describe("xpForActivity", () => {
  it("awards the fixed XP of each learning fact", () => {
    expect([xpForActivity("PAGE_VIEWED"), xpForActivity("LESSON_COMPLETED"), xpForActivity("MODULE_COMPLETED"), xpForActivity("EVALUATION_PASSED")]).toEqual([
      5, 50, 200, 100,
    ]);
  });

  it("awards an achievement its own reward, ignoring the reward for other kinds", () => {
    expect(xpForActivity("ACHIEVEMENT_UNLOCKED", 250)).toBe(250);
    expect(xpForActivity("ACHIEVEMENT_UNLOCKED")).toBe(0);
    expect(xpForActivity("ACHIEVEMENT_UNLOCKED", -10)).toBe(0);
    expect(xpForActivity("LESSON_COMPLETED", 999)).toBe(50);
  });
});

describe("computeLevel", () => {
  it.each([
    [0, { level: 1, xpIntoLevel: 0, nextLevelXp: 500 }],
    [499, { level: 1, xpIntoLevel: 499, nextLevelXp: 500 }],
    [500, { level: 2, xpIntoLevel: 0, nextLevelXp: 1000 }],
    [999, { level: 2, xpIntoLevel: 499, nextLevelXp: 1000 }],
    [1000, { level: 3, xpIntoLevel: 0, nextLevelXp: 1500 }],
    [4500, { level: 10, xpIntoLevel: 0, nextLevelXp: 5000 }],
  ])("maps %i XP to its level", (xp: number, expected: { level: number; xpIntoLevel: number; nextLevelXp: number }) => {
    expect(computeLevel(xp)).toEqual(expected);
  });

  it("treats negative XP as zero", () => {
    expect(computeLevel(-20)).toEqual({ level: 1, xpIntoLevel: 0, nextLevelXp: 500 });
  });

  it("gives the XP at which a level starts", () => {
    expect([xpForLevel(1), xpForLevel(10), xpForLevel(25)]).toEqual([0, 4500, 12000]);
    expect(computeLevel(xpForLevel(25)).level).toBe(25);
  });
});

describe("computeStreaks", () => {
  const today: string = "2026-10-28";

  it("returns zero without activity", () => {
    expect(computeStreaks([], today)).toEqual({ current: 0, longest: 0 });
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreaks(["2026-10-26", "2026-10-27", "2026-10-28"], today)).toEqual({ current: 3, longest: 3 });
  });

  it("keeps the streak alive when the last activity was yesterday", () => {
    expect(computeStreaks(["2026-10-26", "2026-10-27"], today)).toEqual({ current: 2, longest: 2 });
  });

  it("breaks the streak after a whole day without activity", () => {
    expect(computeStreaks(["2026-10-25", "2026-10-26"], today)).toEqual({ current: 0, longest: 2 });
  });

  it("restarts the count after a gap and keeps the longest run", () => {
    const dates: string[] = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-06", "2026-10-27", "2026-10-28"];

    expect(computeStreaks(dates, today)).toEqual({ current: 2, longest: 4 });
  });

  it("ignores repeated and unordered days", () => {
    expect(computeStreaks(["2026-10-28", "2026-10-27", "2026-10-28", "2026-10-27"], today)).toEqual({ current: 2, longest: 2 });
  });

  it("ignores days after today", () => {
    expect(computeStreaks(["2026-10-28", "2026-10-29", "2026-10-30"], today)).toEqual({ current: 1, longest: 1 });
  });

  it("crosses month boundaries", () => {
    expect(computeStreaks(["2026-09-30", "2026-10-01"], "2026-10-01")).toEqual({ current: 2, longest: 2 });
  });
});

describe("buildGamificationStats", () => {
  it("combines totals, level and streaks", () => {
    expect(buildGamificationStats({ totals: { xpTotal: 1255, xpToday: 55 }, activeDates: ["2026-10-27", "2026-10-28"], today: "2026-10-28" })).toEqual({
      xpTotal: 1255,
      level: 3,
      xpIntoLevel: 255,
      nextLevelXp: 1500,
      streakDays: 2,
      longestStreak: 2,
      xpToday: 55,
    });
  });
});
