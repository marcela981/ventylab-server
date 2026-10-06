/*
 * Funcionalidad: Pruebas del estado derivado de asignaciones de evaluación
 * Descripción: Verifica el cálculo puro de UPCOMING, ACTIVE y CLOSED a partir de la ventana y la marca heredada, y la detección de ventanas solapadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  deriveEvaluationAssignmentState,
  evaluationAssignmentWindowsOverlap,
} from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

const NOW: Date = new Date("2026-10-05T12:00:00.000Z");
const HOUR: number = 60 * 60 * 1000;

function at(offsetHours: number): Date {
  return new Date(NOW.getTime() + offsetHours * HOUR);
}

describe("deriveEvaluationAssignmentState", () => {
  it("is UPCOMING before the window starts", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(1), endsAt: at(2) }, NOW)).toBe("UPCOMING");
  });

  it("is ACTIVE inside the window, including its bounds", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(-1), endsAt: at(1) }, NOW)).toBe("ACTIVE");
    expect(deriveEvaluationAssignmentState({ startsAt: NOW, endsAt: at(1) }, NOW)).toBe("ACTIVE");
    expect(deriveEvaluationAssignmentState({ startsAt: at(-1), endsAt: NOW }, NOW)).toBe("ACTIVE");
  });

  it("is ACTIVE when a legacy window has no end", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(-10) }, NOW)).toBe("ACTIVE");
  });

  it("is CLOSED after the window ends", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(-2), endsAt: at(-1) }, NOW)).toBe("CLOSED");
  });

  it("is CLOSED when the legacy assignment was deactivated", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(-1), legacyIsActive: false }, NOW)).toBe("CLOSED");
  });

  it("is CLOSED when an upcoming assignment was closed early", () => {
    expect(deriveEvaluationAssignmentState({ startsAt: at(5), endsAt: at(-1) }, NOW)).toBe("CLOSED");
  });
});

describe("evaluationAssignmentWindowsOverlap", () => {
  it("detects overlapping windows", () => {
    expect(evaluationAssignmentWindowsOverlap({ startsAt: at(0), endsAt: at(3) }, { startsAt: at(2), endsAt: at(4) })).toBe(true);
  });

  it("allows back-to-back windows", () => {
    expect(evaluationAssignmentWindowsOverlap({ startsAt: at(0), endsAt: at(2) }, { startsAt: at(2), endsAt: at(4) })).toBe(false);
  });

  it("treats an open-ended window as overlapping everything after its start", () => {
    expect(evaluationAssignmentWindowsOverlap({ startsAt: at(0) }, { startsAt: at(100), endsAt: at(101) })).toBe(true);
  });

  it("ignores deactivated legacy assignments", () => {
    expect(evaluationAssignmentWindowsOverlap({ startsAt: at(0), legacyIsActive: false }, { startsAt: at(1), endsAt: at(2) })).toBe(false);
  });
});
