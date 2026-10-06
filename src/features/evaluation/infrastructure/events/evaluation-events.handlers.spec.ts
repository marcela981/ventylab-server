/*
 * Funcionalidad: Pruebas de los manejadores de eventos de evaluaciones
 * Descripción: Verifica que la activación de una evaluación se emite en tiempo real a la sala group:{groupId} con su carga, que una nota publicada se emite como grade:published al usuario, que una nota recalculada solo se reemite si ya estaba publicada y que un fallo del publicador no se propaga
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { EvaluationActivatedEvent } from "@/features/evaluation/domain/events/evaluation-assignment.events";
import { EvaluationGradePublishedEvent, EvaluationGradeUpdatedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import {
  EVALUATION_ACTIVATED_REALTIME_EVENT,
  EvaluationEventsHandlers,
  GRADE_PUBLISHED_REALTIME_EVENT,
} from "@/features/evaluation/infrastructure/events/evaluation-events.handlers";

function publisher(emitToRoom: jest.Mock, emitToUser: jest.Mock = jest.fn()): IRealtimePublisher {
  return { emitToRoom, emitToUser } as unknown as IRealtimePublisher;
}

function gradePublishedEvent(): EvaluationGradePublishedEvent {
  return new EvaluationGradePublishedEvent({
    attemptId: "attempt-1",
    evaluationId: "evaluation-1",
    userId: "student-1",
    score: 8,
    maxScore: 10,
    grade: 4,
    passed: true,
    publishedAt: new Date("2026-10-06T10:00:00.000Z"),
  });
}

function activatedEvent(): EvaluationActivatedEvent {
  return new EvaluationActivatedEvent({
    assignmentId: "assignment-1",
    evaluationId: "evaluation-1",
    groupId: "group-1",
    title: "Midterm",
    type: "EXAM",
    startsAt: new Date("2026-10-06T08:00:00.000Z"),
    endsAt: new Date("2026-10-06T10:00:00.000Z"),
    performedBy: "teacher-1",
  });
}

describe("EvaluationEventsHandlers", () => {
  it("emits evaluation:activated to the group room", () => {
    const emitToRoom: jest.Mock = jest.fn();

    new EvaluationEventsHandlers(publisher(emitToRoom)).handleEvaluationActivated(activatedEvent());

    expect(EVALUATION_ACTIVATED_REALTIME_EVENT).toBe("evaluation:activated");
    expect(emitToRoom).toHaveBeenCalledWith("group:group-1", "evaluation:activated", {
      evaluationId: "evaluation-1",
      assignmentId: "assignment-1",
      title: "Midterm",
      type: "EXAM",
      startsAt: new Date("2026-10-06T08:00:00.000Z"),
      endsAt: new Date("2026-10-06T10:00:00.000Z"),
    });
  });

  it("swallows publisher failures", () => {
    const emitToRoom: jest.Mock = jest.fn().mockImplementation(() => {
      throw new Error("socket down");
    });

    expect(() => new EvaluationEventsHandlers(publisher(emitToRoom)).handleEvaluationActivated(activatedEvent())).not.toThrow();
  });

  it("emits grade:published to the student", () => {
    const emitToUser: jest.Mock = jest.fn();

    new EvaluationEventsHandlers(publisher(jest.fn(), emitToUser)).handleGradePublished(gradePublishedEvent());

    expect(GRADE_PUBLISHED_REALTIME_EVENT).toBe("grade:published");
    expect(emitToUser).toHaveBeenCalledWith("student-1", "grade:published", {
      attemptId: "attempt-1",
      evaluationId: "evaluation-1",
      score: 8,
      maxScore: 10,
      grade: 4,
      passed: true,
      publishedAt: new Date("2026-10-06T10:00:00.000Z"),
    });
  });

  it("swallows publisher failures when notifying a published grade", () => {
    const emitToUser: jest.Mock = jest.fn().mockImplementation(() => {
      throw new Error("socket down");
    });

    expect(() => new EvaluationEventsHandlers(publisher(jest.fn(), emitToUser)).handleGradePublished(gradePublishedEvent())).not.toThrow();
  });

  it("re-emits grade:published for a regraded attempt only when its grade is already published", () => {
    const emitToUser: jest.Mock = jest.fn();
    const handlers: EvaluationEventsHandlers = new EvaluationEventsHandlers(publisher(jest.fn(), emitToUser));
    const base: ConstructorParameters<typeof EvaluationGradeUpdatedEvent>[0] = {
      attemptId: "attempt-1",
      evaluationId: "evaluation-1",
      userId: "student-1",
      score: 6,
      maxScore: 10,
      grade: 3,
      passed: true,
    };

    handlers.handleGradeUpdated(new EvaluationGradeUpdatedEvent(base));
    handlers.handleGradeUpdated(new EvaluationGradeUpdatedEvent({ ...base, publishedAt: new Date("2026-10-06T10:00:00.000Z") }));

    expect(emitToUser).toHaveBeenCalledTimes(1);
    expect(emitToUser).toHaveBeenCalledWith("student-1", GRADE_PUBLISHED_REALTIME_EVENT, {
      attemptId: "attempt-1",
      evaluationId: "evaluation-1",
      score: 6,
      maxScore: 10,
      grade: 3,
      passed: true,
      publishedAt: new Date("2026-10-06T10:00:00.000Z"),
    });
  });
});
