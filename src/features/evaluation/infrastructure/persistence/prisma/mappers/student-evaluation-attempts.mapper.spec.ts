/*
 * Funcionalidad: Pruebas del mapeador Prisma de intentos y resúmenes del estudiante
 * Descripción: Verifica que el resumen de una evaluación toma el nivel propio o, si no tiene, el de su módulo, con título, orden y ruta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type StudentEvaluationBriefRow,
  StudentEvaluationAttemptsMapper,
} from "@/features/evaluation/infrastructure/persistence/prisma/mappers/student-evaluation-attempts.mapper";

const BASE: StudentEvaluationBriefRow = {
  id: "evaluation-1",
  title: "Quiz",
  type: "QUIZ",
  description: null,
  durationMinutes: null,
  maxAttempts: 1,
  showResultsImmediately: true,
  moduleId: null,
  level: null,
  module: null,
  _count: { questions: 3 },
};

describe("StudentEvaluationAttemptsMapper.toBrief curriculum", () => {
  it("uses the level of the evaluation first", () => {
    const row: StudentEvaluationBriefRow = {
      ...BASE,
      moduleId: "module-1",
      level: { id: "level-own", title: "Own", order: 2, track: "mecanica" },
      module: { level: { id: "level-module", title: "Module level", order: 1, track: "ventylab" } },
    };

    expect(StudentEvaluationAttemptsMapper.toBrief(row).curriculum).toEqual({ moduleId: "module-1", levelId: "level-own", levelTitle: "Own", levelOrder: 2, track: "mecanica" });
  });

  it("falls back to the level of the module", () => {
    const row: StudentEvaluationBriefRow = { ...BASE, moduleId: "module-1", module: { level: { id: "level-module", title: "Module level", order: 1, track: "ventylab" } } };

    expect(StudentEvaluationAttemptsMapper.toBrief(row).curriculum).toMatchObject({ levelId: "level-module", track: "ventylab" });
  });

  it("leaves every field empty for an evaluation outside the curriculum", () => {
    expect(StudentEvaluationAttemptsMapper.toBrief(BASE).curriculum).toEqual({
      moduleId: undefined,
      levelId: undefined,
      levelTitle: undefined,
      levelOrder: undefined,
      track: undefined,
    });
  });
});
