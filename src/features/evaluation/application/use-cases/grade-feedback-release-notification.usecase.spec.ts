/*
 * Funcionalidad: Pruebas del caso de uso NotifyReleasedGradeFeedbackUseCase
 * Descripción: Verifica que al liberar las respuestas se avisa FEEDBACK_READY solo si la retroalimentación global vigente está READY, y que no se avisa mientras se genera
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { feedbackRecord, InMemoryGradeFeedbacksRepository } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { NotifyReleasedGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-release-notification.usecase";
import { EvaluationAnswersReleasedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { GradeFeedbackReadyEvent } from "@/features/evaluation/domain/events/grade-feedback.events";

const RELEASED: EvaluationAnswersReleasedEvent = new EvaluationAnswersReleasedEvent({
  attemptId: "attempt-1",
  evaluationId: "evaluation-1",
  userId: "student-1",
  releasedAt: new Date(),
  performedBy: "teacher-1",
});

function run(records: ReturnType<typeof feedbackRecord>[]): { events: DomainEvent[]; promise: Promise<boolean> } {
  const events: DomainEvent[] = [];
  const bus: IEventBus = { publish: (published: DomainEvent[]): void => void events.push(...published) };
  const promise: Promise<boolean> = new NotifyReleasedGradeFeedbackUseCase(new InMemoryGradeFeedbacksRepository(records), bus).execute(RELEASED);

  return { events, promise };
}

describe("NotifyReleasedGradeFeedbackUseCase", () => {
  it("should announce the READY overall feedback when the answers are released", async () => {
    const { events, promise } = run([feedbackRecord({ id: "overall-1" }), feedbackRecord({ id: "question-1", questionId: "q1" })]);

    expect(await promise).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(GradeFeedbackReadyEvent);
    expect(events[0]).toMatchObject({ attemptId: "attempt-1", userId: "student-1", feedbackId: "overall-1" });
  });

  it("should stay silent while the feedback is still generating", async () => {
    const { events, promise } = run([feedbackRecord({ id: "overall-1", status: "PENDING" })]);

    expect(await promise).toBe(false);
    expect(events).toHaveLength(0);
  });
});
