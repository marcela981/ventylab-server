/*
 * Funcionalidad: Pruebas del mapeador de retroalimentación de calificación
 * Descripción: Verifica que la vista del estudiante exponga solo el estado, el contenido y el origen de la retroalimentación lista (sin proveedor ni modelo) y que la del docente incluya proveedor, modelo y estado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackRatingView } from "@/features/evaluation/application/ports/grade-feedback-ratings-reader.interface";
import { GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { feedbackRecord } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { type GradeFeedbackDTO, type StudentGradeFeedbackDTO } from "@/features/evaluation/presentation/dtos/grade-feedback.dto";
import { GradeFeedbacksMapper } from "@/features/evaluation/presentation/mappers/grade-feedbacks.mapper";

const RESULT: GradeFeedbackResult = new GradeFeedbackResult({
  attemptId: "attempt-1",
  overall: feedbackRecord({ id: "overall" }),
  questions: [feedbackRecord({ id: "fq1", questionId: "q1", status: "PENDING", content: "", source: "DETERMINISTIC" })],
});

describe("GradeFeedbacksMapper", () => {
  it("exposes only the feedback id (the rating target), status, content and source to the student, never provider or model", () => {
    const dto: StudentGradeFeedbackDTO = GradeFeedbacksMapper.toStudentDTO(RESULT);

    expect(JSON.parse(JSON.stringify(dto))).toEqual({
      attemptId: "attempt-1",
      overall: { id: "overall", questionId: null, status: "READY", source: "LLM", content: "Buen trabajo.", myRating: null },
      questions: [{ id: "fq1", questionId: "q1", status: "PENDING", source: null, content: null, myRating: null }],
    });
  });

  it("includes provider, model and status for teachers", () => {
    const dto: GradeFeedbackDTO = GradeFeedbacksMapper.toTeacherDTO(RESULT);

    expect(dto.overall).toMatchObject({ id: "overall", questionId: null, status: "READY", source: "LLM", provider: "gemini", model: "gemini-2.0-flash" });
    expect(dto.questions[0]).toMatchObject({ id: "fq1", status: "PENDING", source: null, provider: "gemini" });
  });
});

describe("GradeFeedbacksMapper.toStudentDTO myRating", () => {
  it("embeds the own rating of a READY block and null elsewhere", () => {
    const rating: GradeFeedbackRatingView = {
      id: "rating-1",
      targetId: "overall",
      surface: "EVALUATION_FEEDBACK",
      helpful: false,
      comment: "Muy general",
      quality: 2,
      createdAt: new Date("2026-10-05T12:00:00.000Z"),
      updatedAt: new Date("2026-10-05T12:05:00.000Z"),
    };
    const dto: StudentGradeFeedbackDTO = GradeFeedbacksMapper.toStudentDTO(
      new GradeFeedbackResult({
        attemptId: "attempt-1",
        overall: feedbackRecord({ id: "overall" }),
        questions: [feedbackRecord({ id: "fq1", questionId: "q1" })],
        ratings: new Map<string, GradeFeedbackRatingView>([["overall", rating]]),
      }),
    );

    expect(dto.overall?.myRating).toEqual(
      expect.objectContaining({ id: "rating-1", surface: "EVALUATION_FEEDBACK", helpful: false, comment: "Muy general", quality: 2, updatedAt: "2026-10-05T12:05:00.000Z" }),
    );
    expect(dto.questions[0].myRating).toBeNull();
  });
});
