/*
 * Funcionalidad: Pruebas del debriefing de una sesión de simulación
 * Descripción: Verifica el desenlace (fallecido con sus momentos críticos, o nulo sin evolución), las decisiones con valor anterior y nuevo (sin cambios repetidos), la aparición de alarmas y estados del paciente en orden y el tope de la línea de tiempo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineEvent, type EngineMetrics, type ReplayResult } from "@/features/simulation/domain/engine";
import {
  buildSessionDebrief,
  DEBRIEF_TIMELINE_MAX_ITEMS,
  type DebriefTimelineItem,
  type SessionDebrief,
} from "@/features/simulation/domain/sessions/simulation-session-debrief";

function metricsAt(simTimeMs: number, alarms: string[], patient: Partial<NonNullable<EngineMetrics["patient"]>> | null): EngineMetrics {
  return {
    simTimeMs,
    alarms: alarms.map((code: string) => ({ code, severity: "HIGH", value: 0, threshold: 0 })),
    patient:
      patient === null
        ? null
        : {
          status: "STABLE",
          severity: 0,
          heartRateBpm: 90,
          insults: [],
          criticalExposureMin: 0,
          firstCriticalAtMs: null,
          arrestAtMs: null,
          deceasedAtMs: null,
          ...patient,
        },
  } as unknown as EngineMetrics;
}

describe("buildSessionDebrief", () => {
  it("reports the death, the decisions, the alarm onsets and the status changes in time order", () => {
    const timeline: EngineMetrics[] = [
      metricsAt(1000, [], {}),
      metricsAt(2000, ["LOW_SPO2"], { status: "UNSTABLE" }),
      metricsAt(3000, ["LOW_SPO2"], { status: "CRITICAL", firstCriticalAtMs: 3000 }),
      metricsAt(4000, ["CARDIAC_ARREST"], { status: "ARREST", firstCriticalAtMs: 3000, arrestAtMs: 4000 }),
      metricsAt(5000, ["CARDIAC_ARREST"], { status: "DECEASED", firstCriticalAtMs: 3000, arrestAtMs: 4000, deceasedAtMs: 5000 }),
    ];
    const result: ReplayResult = { metricsTimeline: timeline, final: timeline[timeline.length - 1] };
    const events: EngineEvent[] = [
      { type: "PARAM_CHANGE", simTimeMs: 2500, changes: { peepCmH2O: 10, fio2: 0.9 } },
      { type: "PARAM_CHANGE", simTimeMs: 1500, changes: { fio2: 0.9 } },
    ];

    const debrief: SessionDebrief = buildSessionDebrief(result, events, { peepCmH2O: 5, fio2: 0.6 });

    expect(debrief.outcome).toEqual({ status: "DECEASED", firstCriticalAtMs: 3000, arrestAtMs: 4000, deceasedAtMs: 5000 });
    expect(debrief.timeline.map((item: DebriefTimelineItem): string => `${item.simTimeMs}:${item.kind}:${item.code ?? ""}`)).toEqual([
      "1500:DECISION:",
      "2000:PATIENT_STATUS:UNSTABLE",
      "2000:ALARM:LOW_SPO2",
      "2500:DECISION:",
      "3000:PATIENT_STATUS:CRITICAL",
      "4000:PATIENT_STATUS:ARREST",
      "4000:ALARM:CARDIAC_ARREST",
      "5000:PATIENT_STATUS:DECEASED",
    ]);
    expect(debrief.timeline[0].changes).toEqual([{ field: "fio2", from: 0.6, to: 0.9 }]);
    // FiO2 was already 0.9: only the PEEP change is a decision.
    expect(debrief.timeline[3].changes).toEqual([{ field: "peepCmH2O", from: 5, to: 10 }]);
  });

  it("has a null outcome without patient evolution and caps the timeline", () => {
    const timeline: EngineMetrics[] = Array.from({ length: 300 }, (_: unknown, index: number): EngineMetrics =>
      metricsAt(index * 1000, index % 2 === 0 ? ["APNEA"] : ["DISCONNECTION"], null),
    );
    const result: ReplayResult = { metricsTimeline: timeline, final: timeline[timeline.length - 1] };

    const debrief: SessionDebrief = buildSessionDebrief(result, [], {});

    expect(debrief.outcome.status).toBeNull();
    expect(debrief.timeline).toHaveLength(DEBRIEF_TIMELINE_MAX_ITEMS);
  });
});
