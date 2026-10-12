/*
 * Funcionalidad: Pruebas de la analítica de evaluaciones
 * Descripción: Verifica la mediana con cantidades pares e impares, los límites del histograma de notas en intervalos de 0.5 (2.5 cae en [2.5, 3.0) y 5.0 en el último) y el índice de dificultad y la tasa de acierto por pregunta (sin respuesta cuenta 0, puntaje parcial proporcional, sin intentos o sin puntos queda indefinido)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  buildGradeHistogram,
  computeQuestionStats,
  type EvaluationQuestionStats,
  type GradeHistogramBucket,
  medianOf,
} from "@/features/evaluation/domain/services/evaluation-analytics";

describe("evaluation analytics", () => {
  it("computes the median of odd and even samples and nothing for an empty one", () => {
    expect(medianOf([4, 1, 3])).toBe(3);
    expect(medianOf([1, 2, 4, 5])).toBe(3);
    expect(medianOf([])).toBeUndefined();
  });

  it("builds ten 0.5-wide buckets on the 0–5 scale, the last one including 5.0", () => {
    const histogram: GradeHistogramBucket[] = buildGradeHistogram([0, 0.4, 2.5, 2.9, 4.9, 5]);

    expect(histogram).toHaveLength(10);
    expect(histogram[0]).toEqual({ from: 0, to: 0.5, count: 2 });
    expect(histogram[5]).toEqual({ from: 2.5, to: 3, count: 2 });
    expect(histogram[9]).toEqual({ from: 4.5, to: 5, count: 2 });
    expect(histogram.reduce((total: number, bucket: GradeHistogramBucket) => total + bucket.count, 0)).toBe(6);
  });

  it("derives the difficulty index from the earned fraction over every graded attempt", () => {
    const stats: EvaluationQuestionStats[] = computeQuestionStats({
      questions: [
        { id: "q-choice", order: 1, type: "SINGLE_CHOICE", points: 1 },
        { id: "q-simulation", order: 2, type: "SIMULATION", points: 4 },
        { id: "q-zero", order: 3, type: "OPEN_TEXT", points: 0 },
      ],
      gradedAttemptCount: 4,
      answers: [
        { questionId: "q-choice", earned: 1 },
        { questionId: "q-choice", earned: 1 },
        { questionId: "q-choice", earned: 0 },
        { questionId: "q-simulation", earned: 4 },
        { questionId: "q-simulation", earned: 2 },
        { questionId: "q-simulation" },
        { questionId: "q-zero", earned: 0 },
      ],
    });

    expect(stats[0]).toMatchObject({ answeredCount: 3, correctCount: 2, correctRate: 0.5, difficultyIndex: 0.5 });
    expect(stats[1]).toMatchObject({ answeredCount: 2, correctCount: 1, correctRate: 0.25, difficultyIndex: 0.375 });
    expect(stats[2]).toMatchObject({ correctRate: undefined, difficultyIndex: undefined });
  });

  it("leaves the indexes undefined without graded attempts", () => {
    const stats: EvaluationQuestionStats[] = computeQuestionStats({
      questions: [{ id: "q-choice", order: 1, type: "TRUE_FALSE", points: 1 }],
      gradedAttemptCount: 0,
      answers: [],
    });

    expect(stats).toEqual([
      { questionId: "q-choice", order: 1, type: "TRUE_FALSE", points: 1, answeredCount: 0, correctCount: 0, correctRate: undefined, difficultyIndex: undefined },
    ]);
  });
});
