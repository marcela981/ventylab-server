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
      overall: { id: "overall", questionId: null, status: "READY", source: "LLM", content: "Buen trabajo." },
      questions: [{ id: "fq1", questionId: "q1", status: "PENDING", source: null, content: null }],
    });
  });

  it("includes provider, model and status for teachers", () => {
    const dto: GradeFeedbackDTO = GradeFeedbacksMapper.toTeacherDTO(RESULT);

    expect(dto.overall).toMatchObject({ id: "overall", questionId: null, status: "READY", source: "LLM", provider: "gemini", model: "gemini-2.0-flash" });
    expect(dto.questions[0]).toMatchObject({ id: "fq1", status: "PENDING", source: null, provider: "gemini" });
  });
});
