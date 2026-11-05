/*
 * Funcionalidad: Pruebas de la visibilidad de los resultados de una sesión de simulación
 * Descripción: Verifica que el estudiante de una sesión EXAM no ve el puntaje sin la nota liberada ni la corrección sin las respuestas liberadas, que el personal docente y las sesiones libres lo ven todo, y que el mapeo de las respuestas vacía el puntaje, el desglose, los objetivos (también dentro de las métricas), el desenlace y la línea de tiempo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ExamAttemptInfo } from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import { type SimulationSessionSummaryResult } from "@/features/simulation/application/results/simulation-session.results";
import {
  FULL_RESULTS_VISIBILITY,
  SimulationResultsVisibilityService,
  visibilityFor,
} from "@/features/simulation/application/services/simulation-results-visibility.service";
import { FakeExamAttemptReader } from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationSessionSummaryDTO } from "@/features/simulation/presentation/dtos/simulation-session.dto";
import { SimulationSessionsResponseMapper } from "@/features/simulation/presentation/mappers/simulation-sessions.mapper";

const NOW: Date = new Date("2026-11-04T12:00:00Z");
const STUDENT: { id: string; role: string } = { id: "student-1", role: "STUDENT" };
const TEACHER: { id: string; role: string } = { id: "teacher-1", role: "TEACHER" };

function session(mode: "FREE" | "EXAM"): SimulationSession {
  return SimulationSession.start({
    userId: STUDENT.id,
    caseId: "case-1",
    mode,
    attemptId: mode === "EXAM" ? "attempt-1" : undefined,
    questionId: mode === "EXAM" ? "question-1" : undefined,
    seed: 1,
    engineVersion: "2.0.0",
    timeMultiplier: 1,
    now: NOW,
  });
}

function attempt(overrides: Partial<ExamAttemptInfo> = {}): ExamAttemptInfo {
  return { id: "attempt-1", userId: STUDENT.id, evaluationId: "evaluation-1", status: "GRADED", ...overrides };
}

describe("simulation results visibility", () => {
  it("withholds the EXAM score until the grade release and the correction until the answers release", () => {
    expect(visibilityFor(session("EXAM"), STUDENT, attempt())).toEqual({ score: false, correction: false });
    expect(visibilityFor(session("EXAM"), STUDENT, attempt({ gradePublishedAt: NOW }))).toEqual({ score: true, correction: false });
    expect(visibilityFor(session("EXAM"), STUDENT, attempt({ gradePublishedAt: NOW, answersReleasedAt: NOW }))).toEqual(FULL_RESULTS_VISIBILITY);
    expect(visibilityFor(session("EXAM"), STUDENT, undefined)).toEqual({ score: false, correction: false });
  });

  it("shows everything to staff and in FREE sessions", () => {
    expect(visibilityFor(session("EXAM"), TEACHER, attempt())).toEqual(FULL_RESULTS_VISIBILITY);
    expect(visibilityFor(session("FREE"), STUDENT, undefined)).toEqual(FULL_RESULTS_VISIBILITY);
  });

  it("reads the release marks of the attempts in one batch for a list", async () => {
    const reader: FakeExamAttemptReader = new FakeExamAttemptReader();
    const exam: SimulationSession = session("EXAM");
    const free: SimulationSession = session("FREE");

    reader.attempts.set("attempt-1", attempt({ gradePublishedAt: NOW }));

    const visibility: Map<string, { score: boolean; correction: boolean }> = await new SimulationResultsVisibilityService(reader).forSessions([exam, free], STUDENT);

    expect(visibility.get(exam.id)).toEqual({ score: true, correction: false });
    expect(visibility.get(free.id)).toEqual(FULL_RESULTS_VISIBILITY);
  });

  it("strips the score, the breakdown, the targets, the outcome and the timeline from a withheld summary", () => {
    const result: SimulationSessionSummaryResult = {
      session: session("EXAM"),
      summary: {
        engineVersion: "2.0.0",
        simTimeMs: 1000,
        durationMs: 1000,
        finalMetrics: { simTimeMs: 1000, targets: [{ id: "SPO2", status: "MET" }] },
        targets: [{ id: "SPO2", status: "MET", value: 95, min: 88, max: 95 }],
        score: 0.8,
        breakdown: [{ criterion: "TARGETS_REACHED", points: 1 }],
        aiHelpCount: 0,
        outcome: { status: "STABLE", firstCriticalAtMs: null, arrestAtMs: null, deceasedAtMs: null },
        timeline: [{ simTimeMs: 500, kind: "ALARM", code: "LOW_SPO2" }],
      },
    } as unknown as SimulationSessionSummaryResult;

    const withheld: SimulationSessionSummaryDTO = SimulationSessionsResponseMapper.toSummaryDTO(result, { score: false, correction: false });
    const full: SimulationSessionSummaryDTO = SimulationSessionsResponseMapper.toSummaryDTO(result);

    expect(withheld).toMatchObject({ score: null, breakdown: [], targets: [], outcome: null, timeline: [], resultsWithheld: true });
    expect((withheld.finalMetrics as { targets: unknown[] }).targets).toEqual([]);
    expect(full).toMatchObject({ score: 0.8, resultsWithheld: false });
    expect(full.breakdown).toHaveLength(1);
  });
});
