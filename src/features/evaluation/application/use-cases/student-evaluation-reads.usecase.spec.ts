/*
 * Funcionalidad: Pruebas de las consultas del estudiante sobre evaluaciones
 * Descripción: Verifica GetEvaluationAttemptUseCase (solo el propietario, barajado determinista por intento, cierre perezoso al leer, hora del servidor) y GetMyEvaluationsUseCase (asignaciones del grupo del estudiante con su estado, resumen de la evaluación y sus intentos, cierre perezoso al listar, lista vacía sin grupo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type StudentEvaluationAttemptDetailResult,
  type StudentEvaluationListItemResult,
} from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { buildView } from "@/features/evaluation/application/testing/evaluation-assignment-test-doubles-spec";
import {
  attemptQuestion,
  type AttemptDoubles,
  buildAttemptDoubles,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { GetEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-attempt.usecase";
import { GetMyEvaluationsUseCase } from "@/features/evaluation/application/use-cases/get-my-evaluations.usecase";
import { GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { EvaluationAttemptNotFoundError } from "@/features/evaluation/domain/evaluation.errors";

const MANY_QUESTIONS: EvaluationQuestionItem[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"].map((id: string) => attemptQuestion(id));

function getAttempt(doubles: AttemptDoubles, attemptId: string = "attempt-1", userId: string = STUDENT_ID): Promise<StudentEvaluationAttemptDetailResult> {
  return new GetEvaluationAttemptUseCase(doubles.closer).execute(attemptId, userId);
}

function questionIds(result: StudentEvaluationAttemptDetailResult): string[] {
  return result.questions.map((question: EvaluationQuestionItem) => question.id);
}

describe("GetEvaluationAttemptUseCase", () => {
  it("returns the attempt with its evaluation, saved answers and server time to the owner", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] }] })] });

    const result: StudentEvaluationAttemptDetailResult = await getAttempt(doubles);

    expect(result.attempt.answers).toHaveLength(1);
    expect(result.evaluation.title).toBe("Ventilation basics");
    expect(questionIds(result)).toEqual(["q1", "q2"]);
    expect(result.now).toBeInstanceOf(Date);
  });

  it("returns 404 to anyone else", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(getAttempt(doubles, "attempt-1", "student-2")).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
    await expect(getAttempt(doubles, "attempt-missing")).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
  });

  it("shuffles the questions deterministically per attempt", async () => {
    const evaluation: ReturnType<typeof buildAttemptEvaluation> = buildAttemptEvaluation({ questions: MANY_QUESTIONS, shuffleQuestions: true });
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation, attempts: [buildStoredAttempt(), buildStoredAttempt({ id: "attempt-2", attemptNumber: 2, status: "GRADED" })] });

    const first: StudentEvaluationAttemptDetailResult = await getAttempt(doubles);
    const again: StudentEvaluationAttemptDetailResult = await getAttempt(doubles);
    const other: StudentEvaluationAttemptDetailResult = await getAttempt(doubles, "attempt-2");

    expect(questionIds(again)).toEqual(questionIds(first));
    expect(questionIds(first)).not.toEqual(questionIds(other));
    expect([...questionIds(first)].sort()).toEqual(MANY_QUESTIONS.map((question: EvaluationQuestionItem) => question.id).sort());
  });

  it("lazily closes an expired attempt when it is read", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt: minutesFromNow(-3) })] });

    const result: StudentEvaluationAttemptDetailResult = await getAttempt(doubles);

    expect(result.attempt.status).toBe("GRADED");
    expect(result.attempt.isPublished).toBe(true);
  });
});

describe("GetMyEvaluationsUseCase", () => {
  function listUseCase(doubles: AttemptDoubles): GetMyEvaluationsUseCase {
    return new GetMyEvaluationsUseCase(doubles.attemptsRepository, doubles.closer, new GetStudentEvaluationAssignmentsUseCase(doubles.assignmentsRepository, doubles.access));
  }

  it("lists the assignments of the student group with the evaluation summary and own attempts", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      attempts: [buildStoredAttempt({ status: "GRADED", grade: 4, submittedAt: minutesFromNow(-1) }), buildStoredAttempt({ id: "attempt-x", userId: "student-2" })],
    });

    (doubles.assignmentsRepository.getStudentGroupViews as jest.Mock).mockResolvedValue([buildView({ evaluationId: "evaluation-1" })]);
    doubles.attemptsRepository.briefs.push({ id: "evaluation-1", title: "Ventilation basics", type: "QUIZ", maxAttempts: 2, questionCount: 2, showResultsImmediately: true });

    const items: StudentEvaluationListItemResult[] = await listUseCase(doubles).execute(STUDENT_ID);

    expect(items).toHaveLength(1);
    expect(items[0].assignment.state).toBe("ACTIVE");
    expect(items[0].evaluation?.maxAttempts).toBe(2);
    expect(items[0].attempts.map((attempt: { id: string }) => attempt.id)).toEqual(["attempt-1"]);
  });

  it("lazily closes the expired attempts of the student before listing", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt: minutesFromNow(-3) })] });

    await listUseCase(doubles).execute(STUDENT_ID);

    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).toBe("GRADED");
  });

  it("returns an empty list for a student without group", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ studentGroupId: null });

    await expect(listUseCase(doubles).execute(STUDENT_ID)).resolves.toEqual([]);
  });
});
