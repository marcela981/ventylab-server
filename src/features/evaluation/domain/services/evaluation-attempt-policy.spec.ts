/*
 * Funcionalidad: Pruebas de la política de intentos de evaluación
 * Descripción: Verifica la clave del candado por usuario y evaluación, el cálculo del plazo del intento en el servidor (duración, cierre de la asignación o ambos), el plazo efectivo tras un cierre anticipado, la expiración con 30 s de gracia y el barajado determinista por intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ATTEMPT_SUBMIT_GRACE_MS,
  computeAttemptDeadline,
  effectiveAttemptDeadline,
  evaluationAttemptLockKey,
  isAttemptExpired,
  shuffleForAttempt,
} from "@/features/evaluation/domain/services/evaluation-attempt-policy";

const STARTED_AT: Date = new Date("2026-10-06T08:00:00.000Z");

describe("evaluationAttemptLockKey", () => {
  it("namespaces the lock by evaluation and user", () => {
    expect(evaluationAttemptLockKey("evaluation-1", "user-1")).toBe("evaluations:attempt:evaluation-1:user-1");
  });
});

describe("computeAttemptDeadline", () => {
  it("uses the duration when it ends before the assignment", () => {
    expect(computeAttemptDeadline({ startedAt: STARTED_AT, durationMinutes: 30, endsAt: new Date("2026-10-06T10:00:00.000Z") })).toEqual(
      new Date("2026-10-06T08:30:00.000Z"),
    );
  });

  it("caps the duration at the end of the assignment", () => {
    expect(computeAttemptDeadline({ startedAt: STARTED_AT, durationMinutes: 90, endsAt: new Date("2026-10-06T09:00:00.000Z") })).toEqual(
      new Date("2026-10-06T09:00:00.000Z"),
    );
  });

  it("uses the end of the assignment when the evaluation has no duration", () => {
    expect(computeAttemptDeadline({ startedAt: STARTED_AT, endsAt: new Date("2026-10-06T09:00:00.000Z") })).toEqual(new Date("2026-10-06T09:00:00.000Z"));
  });

  it("uses only the duration for an open-ended legacy assignment and nothing without either", () => {
    expect(computeAttemptDeadline({ startedAt: STARTED_AT, durationMinutes: 10 })).toEqual(new Date("2026-10-06T08:10:00.000Z"));
    expect(computeAttemptDeadline({ startedAt: STARTED_AT })).toBeUndefined();
  });
});

describe("effectiveAttemptDeadline", () => {
  it("tightens the stored deadline when the assignment was closed early", () => {
    expect(effectiveAttemptDeadline(new Date("2026-10-06T09:00:00.000Z"), new Date("2026-10-06T08:20:00.000Z"))).toEqual(new Date("2026-10-06T08:20:00.000Z"));
    expect(effectiveAttemptDeadline(new Date("2026-10-06T09:00:00.000Z"), new Date("2026-10-06T11:00:00.000Z"))).toEqual(new Date("2026-10-06T09:00:00.000Z"));
    expect(effectiveAttemptDeadline(undefined, undefined)).toBeUndefined();
  });
});

describe("isAttemptExpired (check 10)", () => {
  const deadline: Date = new Date("2026-10-06T09:00:00.000Z");

  it("allows the 30 s grace after the deadline", () => {
    expect(ATTEMPT_SUBMIT_GRACE_MS).toBe(30_000);
    expect(isAttemptExpired(deadline, new Date(deadline.getTime() + 30_000))).toBe(false);
  });

  it("expires once the grace is over", () => {
    expect(isAttemptExpired(deadline, new Date(deadline.getTime() + 30_001))).toBe(true);
  });

  it("never expires an attempt without deadline", () => {
    expect(isAttemptExpired(undefined, new Date("2099-01-01T00:00:00.000Z"))).toBe(false);
  });
});

describe("shuffleForAttempt", () => {
  const items: string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("is deterministic per seed and keeps every item", () => {
    const first: string[] = shuffleForAttempt(items, "attempt-1");

    expect(shuffleForAttempt(items, "attempt-1")).toEqual(first);
    expect([...first].sort()).toEqual(items);
  });

  it("produces a different order for another attempt", () => {
    expect(shuffleForAttempt(items, "attempt-1")).not.toEqual(shuffleForAttempt(items, "attempt-2"));
  });

  it("does not mutate the input", () => {
    shuffleForAttempt(items, "attempt-1");

    expect(items).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });
});
