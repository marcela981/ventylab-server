/*
 * Funcionalidad: Pruebas de la instantánea de asistencia
 * Descripción: Verifica que la instantánea de la simulación sea JSON determinista de a lo sumo 3000 caracteres, sin identificadores del estudiante aunque lleguen en la entrada, y que recorte primero los cambios de parámetros más antiguos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ASSIST_MAX_RECENT_CHANGES, ASSIST_SNAPSHOT_MAX_LENGTH, AssistParamChange, AssistSnapshotInput, buildAssistSnapshot } from "./assist-snapshot";
import { buildAssistInput } from "./assist-test-input-spec";

interface ParsedSnapshot {
  case: { title: string; summary?: string; patient?: Record<string, unknown> };
  settings: Record<string, unknown>;
  recentChanges: { atS: number; set: Record<string, unknown>; from?: Record<string, unknown> }[];
}

function manyChanges(count: number): AssistParamChange[] {
  return Array.from({ length: count }, (_value: unknown, index: number): AssistParamChange => ({
    simTimeMs: index * 1000,
    changes: { tidalVolumeMl: 400 + index, peepCmH2O: 5 + (index % 5), fio2: 0.4, respiratoryRateBpm: 14 + (index % 6) },
    previous: { tidalVolumeMl: 399 + index, peepCmH2O: 5, fio2: 0.35, respiratoryRateBpm: 14 },
  }));
}

describe("buildAssistSnapshot", () => {
  it("builds valid JSON with the clinical case, settings, gases and the recent changes in chronological order", () => {
    const input: AssistSnapshotInput = buildAssistInput({
      recentChanges: [
        { simTimeMs: 20000, changes: { peepCmH2O: 8 }, previous: { peepCmH2O: 5 } },
        { simTimeMs: 10000, changes: { tidalVolumeMl: 380 } },
      ],
    });

    const snapshot: string = buildAssistSnapshot(input);
    const parsed: ParsedSnapshot = JSON.parse(snapshot) as ParsedSnapshot;

    expect(parsed.case.title).toBe("Síndrome de distrés respiratorio agudo moderado");
    expect(parsed.case.patient).toEqual({ sex: "FEMALE", ageYears: 54, heightCm: 162, weightKg: 70 });
    expect(parsed.settings.peepCmH2O).toBe(5);
    expect(parsed.recentChanges).toEqual([
      { atS: 10, set: { tidalVolumeMl: 380 } },
      { atS: 20, set: { peepCmH2O: 8 }, from: { peepCmH2O: 5 } },
    ]);
  });

  it("returns the same text for the same input", () => {
    const input: AssistSnapshotInput = buildAssistInput({ recentChanges: manyChanges(4) });

    const first: string = buildAssistSnapshot(input);
    const second: string = buildAssistSnapshot(buildAssistInput({ recentChanges: manyChanges(4) }));

    expect(second).toBe(first);
  });

  it("keeps only the latest changes and stays within 3000 characters by dropping the oldest ones first", () => {
    const input: AssistSnapshotInput = buildAssistInput({ recentChanges: manyChanges(40), summary: "x".repeat(5000) });

    const snapshot: string = buildAssistSnapshot(input);
    const parsed: ParsedSnapshot = JSON.parse(snapshot) as ParsedSnapshot;

    expect(snapshot.length).toBeLessThanOrEqual(ASSIST_SNAPSHOT_MAX_LENGTH);
    expect(parsed.recentChanges.length).toBeGreaterThan(0);
    expect(parsed.recentChanges.length).toBeLessThanOrEqual(ASSIST_MAX_RECENT_CHANGES);
    expect(parsed.recentChanges[parsed.recentChanges.length - 1].atS).toBe(39);
    expect(parsed.case.summary?.length).toBeLessThanOrEqual(600);
  });

  it("never includes student identifiers even when extra fields reach the input", () => {
    const base: AssistSnapshotInput = buildAssistInput();
    const leaky: AssistSnapshotInput = {
      ...base,
      userId: "user-123",
      email: "student@correounivalle.edu.co",
      studentName: "Ana Pérez",
      caseSummary: { ...base.caseSummary, patientName: "Juan Gómez", createdBy: "teacher-9" },
    } as unknown as AssistSnapshotInput;

    const snapshot: string = buildAssistSnapshot(leaky);

    expect(snapshot).not.toMatch(/user-123|correounivalle|Ana Pérez|Juan Gómez|teacher-9|userId|email|Name/);
  });
});
