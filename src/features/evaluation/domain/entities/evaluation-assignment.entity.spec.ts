/*
 * Funcionalidad: Pruebas del agregado EvaluationAssignment
 * Descripción: Verifica la activación (solo evaluaciones READY y ventana válida con fin futuro), el evento de activación, el cierre anticipado y las reglas de edición de la ventana según el estado derivado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type ActivatableEvaluation, EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import {
  EvaluationAssignmentClosedError,
  EvaluationNotActivatableError,
  InvalidEvaluationAssignmentWindowError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationActivatedEvent } from "@/features/evaluation/domain/events/evaluation-assignment.events";

const NOW: Date = new Date("2026-10-05T12:00:00.000Z");
const HOUR: number = 60 * 60 * 1000;
const READY_EVALUATION: ActivatableEvaluation = { id: "evaluation-1", status: "READY", title: "Midterm", type: "EXAM" };

function at(offsetHours: number): Date {
  return new Date(NOW.getTime() + offsetHours * HOUR);
}

function assignment(startsAt: Date, endsAt?: Date, legacyIsActive?: boolean): EvaluationAssignment {
  return EvaluationAssignment.reconstitute({
    id: "assignment-1",
    evaluationId: "evaluation-1",
    groupId: "group-1",
    startsAt,
    endsAt,
    legacyIsActive,
    createdAt: at(-48),
    updatedAt: at(-48),
  });
}

describe("EvaluationAssignment.create", () => {
  it("activates a READY evaluation and queues the activation event", () => {
    const created: EvaluationAssignment = EvaluationAssignment.create({
      evaluation: READY_EVALUATION,
      groupId: "group-1",
      startsAt: at(1),
      endsAt: at(3),
      assignedById: "teacher-1",
      now: NOW,
    });

    const events: DomainEvent[] = created.getEvents();

    expect(created.stateAt(NOW)).toBe("UPCOMING");
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(EvaluationActivatedEvent);
    expect(events[0]).toMatchObject({ assignmentId: created.id, evaluationId: "evaluation-1", groupId: "group-1", title: "Midterm", type: "EXAM" });
  });

  it.each(["DRAFT", "ARCHIVED"] as const)("rejects a %s evaluation", (status: "DRAFT" | "ARCHIVED") => {
    expect(() =>
      EvaluationAssignment.create({ evaluation: { ...READY_EVALUATION, status }, groupId: "group-1", startsAt: at(1), endsAt: at(3), now: NOW }),
    ).toThrow(EvaluationNotActivatableError);
  });

  it("rejects a window that does not start before it ends", () => {
    expect(() => EvaluationAssignment.create({ evaluation: READY_EVALUATION, groupId: "group-1", startsAt: at(3), endsAt: at(3), now: NOW })).toThrow(
      InvalidEvaluationAssignmentWindowError,
    );
  });

  it("rejects a window that already ended", () => {
    expect(() => EvaluationAssignment.create({ evaluation: READY_EVALUATION, groupId: "group-1", startsAt: at(-3), endsAt: at(-1), now: NOW })).toThrow(
      InvalidEvaluationAssignmentWindowError,
    );
  });
});

describe("EvaluationAssignment.close", () => {
  it("closes an active assignment now", () => {
    const active: EvaluationAssignment = assignment(at(-1), at(5));

    active.close(NOW);

    expect(active.endsAt).toEqual(NOW);
    expect(active.stateAt(at(0.01))).toBe("CLOSED");
  });

  it("closes an upcoming assignment so it never opens", () => {
    const upcoming: EvaluationAssignment = assignment(at(2), at(5));

    upcoming.close(NOW);

    expect(upcoming.startsAt).toEqual(NOW);
    expect(upcoming.stateAt(at(3))).toBe("CLOSED");
  });

  it("closes an open-ended legacy assignment", () => {
    const legacy: EvaluationAssignment = assignment(at(-100), undefined, true);

    legacy.close(NOW);

    expect(legacy.stateAt(at(1))).toBe("CLOSED");
  });

  it("rejects closing an already closed assignment", () => {
    expect(() => assignment(at(-5), at(-1)).close(NOW)).toThrow(EvaluationAssignmentClosedError);
    expect(() => assignment(at(-5), undefined, false).close(NOW)).toThrow(EvaluationAssignmentClosedError);
  });
});

describe("EvaluationAssignment.reschedule", () => {
  it("moves both bounds of an upcoming assignment", () => {
    const upcoming: EvaluationAssignment = assignment(at(2), at(5));

    upcoming.reschedule({ startsAt: at(3), endsAt: at(8) }, NOW);

    expect(upcoming.startsAt).toEqual(at(3));
    expect(upcoming.endsAt).toEqual(at(8));
  });

  it("extends or shortens the end of an active assignment", () => {
    const active: EvaluationAssignment = assignment(at(-1), at(5));

    active.reschedule({ endsAt: at(1) }, NOW);

    expect(active.endsAt).toEqual(at(1));
  });

  it("rejects moving the start of an active assignment", () => {
    expect(() => assignment(at(-1), at(5)).reschedule({ startsAt: at(-2) }, NOW)).toThrow(InvalidEvaluationAssignmentWindowError);
  });

  it("rejects an end before now", () => {
    expect(() => assignment(at(-1), at(5)).reschedule({ endsAt: at(-0.5) }, NOW)).toThrow(InvalidEvaluationAssignmentWindowError);
  });

  it("rejects a start that is not before the end", () => {
    expect(() => assignment(at(2), at(5)).reschedule({ startsAt: at(6) }, NOW)).toThrow(InvalidEvaluationAssignmentWindowError);
  });

  it("rejects editing a closed assignment", () => {
    expect(() => assignment(at(-5), at(-1)).reschedule({ endsAt: at(5) }, NOW)).toThrow(EvaluationAssignmentClosedError);
  });
});
