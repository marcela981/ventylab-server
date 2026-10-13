/*
 * Funcionalidad: Semilla de sesiones de simulación de la demostración
 * Descripción: Inserta o actualiza sesiones de simulación libres terminadas (y una abandonada) de varios estudiantes sobre los casos publicados, con su registro de eventos (START, PARAM_CHANGE, AI_HELP, END); el resumen de cada sesión terminada se calcula con el motor de simulación real (replay determinista con semilla fija y la rúbrica por defecto), de modo que la repetición, el resumen y la analítica coinciden con lo que produciría la aplicación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCase as ClinicalCaseRow, type Prisma, type SimulationEventType } from "@prisma/client";

import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseSnapshot } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { ClinicalCasesMapper } from "@/features/clinical-cases/infrastructure/persistence/prisma/mappers/clinical-cases.mapper";
import { SimulationCaseMapper, type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { ENGINE_VERSION, replay, type ReplayResult, type VentilatorSettings } from "@/features/simulation/domain/engine";
import { type SimulationSessionSummary } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { computeSimulationScore, type SimulationScore } from "@/features/simulation/domain/scoring/compute-simulation-score";
import { buildDefaultSimulationRubric, DEFAULT_SIMULATION_RUBRIC_THRESHOLDS } from "@/features/simulation/domain/scoring/simulation-rubric";
import { START_RUBRIC_THRESHOLDS_FIELD } from "@/features/simulation/domain/sessions/simulation-session-rubric";

import { type DemoPerson, demoStudent } from "../demo-cast";
import { addMinutes, type DemoContext, type DemoDb, demoId, upsertAll } from "../demo-support";

import { DEMO_ARDS_CASE_ID, DEMO_COPD_CASE_ID } from "./clinical-cases";

const SIMULATED_MS: number = 180_000;

interface SessionSeed {
  readonly key: string;
  readonly student: DemoPerson;
  readonly caseId: string;
  readonly day: number;
  readonly hour: number;
  readonly seed: number;
  readonly changes: readonly Partial<VentilatorSettings>[];
  readonly aiHelp?: boolean;
  readonly abandoned?: boolean;
}

interface EventSeed {
  readonly simTimeMs: number;
  readonly type: SimulationEventType;
  readonly payload: Prisma.InputJsonObject;
}

function sessionSeeds(): readonly SessionSeed[] {
  return [
    { key: "s01-ards-1", student: demoStudent(0), caseId: DEMO_ARDS_CASE_ID, day: -8, hour: 15, seed: 101, changes: [{ peepCmH2O: 10, fio2: 0.5 }, { tidalVolumeMl: 420 }] },
    { key: "s01-ards-2", student: demoStudent(0), caseId: DEMO_ARDS_CASE_ID, day: -2, hour: 16, seed: 102, changes: [{ tidalVolumeMl: 400, peepCmH2O: 12 }] },
    { key: "s02-ards", student: demoStudent(1), caseId: DEMO_ARDS_CASE_ID, day: -7, hour: 10, seed: 201, changes: [{ tidalVolumeMl: 400 }] },
    { key: "s03-copd", student: demoStudent(2), caseId: DEMO_COPD_CASE_ID, day: -6, hour: 11, seed: 301, changes: [{ respiratoryRateBpm: 12, inspiratoryTimeS: 0.8 }] },
    { key: "s04-ards", student: demoStudent(3), caseId: DEMO_ARDS_CASE_ID, day: -2, hour: 9, seed: 401, changes: [{ fio2: 0.8 }], aiHelp: true },
    { key: "s06-ards", student: demoStudent(5), caseId: DEMO_ARDS_CASE_ID, day: -5, hour: 14, seed: 601, changes: [{ peepCmH2O: 12, tidalVolumeMl: 410 }] },
    { key: "s07-copd", student: demoStudent(6), caseId: DEMO_COPD_CASE_ID, day: -4, hour: 17, seed: 701, changes: [{ respiratoryRateBpm: 14 }] },
    { key: "s08-ards-abandoned", student: demoStudent(7), caseId: DEMO_ARDS_CASE_ID, day: -3, hour: 18, seed: 801, changes: [], abandoned: true },
  ];
}

function eventsOf(seed: SessionSeed): EventSeed[] {
  const start: EventSeed = {
    simTimeMs: 0,
    type: "START",
    payload: {
      caseId: seed.caseId,
      mode: "FREE",
      timeMultiplier: 1,
      engineVersion: ENGINE_VERSION,
      [START_RUBRIC_THRESHOLDS_FIELD]: { ...DEFAULT_SIMULATION_RUBRIC_THRESHOLDS },
    },
  };

  const changes: EventSeed[] = seed.changes.map((change: Partial<VentilatorSettings>, index: number): EventSeed => ({
    simTimeMs: (index + 1) * 30_000,
    type: "PARAM_CHANGE",
    payload: { changes: { ...change } },
  }));

  const help: EventSeed[] = seed.aiHelp ? [{ simTimeMs: 45_000, type: "AI_HELP", payload: {} }] : [];
  const end: EventSeed[] = seed.abandoned ? [] : [{ simTimeMs: SIMULATED_MS, type: "END", payload: { reason: "CLIENT" } }];

  return [start, ...changes, ...help, ...end];
}

async function loadDefinitions(db: DemoDb): Promise<Map<string, SimulationCaseDefinition>> {
  const rows: ClinicalCaseRow[] = await db.clinicalCase.findMany({ where: { id: { in: [DEMO_ARDS_CASE_ID, DEMO_COPD_CASE_ID] } } });
  const definitions: Map<string, SimulationCaseDefinition> = new Map<string, SimulationCaseDefinition>();

  for (const row of rows) {
    const clinicalCase: ClinicalCase = ClinicalCasesMapper.toClinicalCase(row);

    const snapshot: ClinicalCaseSnapshot = {
      id: clinicalCase.id,
      title: clinicalCase.content.title,
      status: clinicalCase.status,
      validatedByExpert: clinicalCase.validatedByExpert,
      difficulty: clinicalCase.content.difficulty,
      pathology: clinicalCase.content.pathology,
      patientAge: clinicalCase.content.patientAge,
      patientWeightKg: clinicalCase.content.patientWeight,
      simulationReady: clinicalCase.isSimulationReady,
      simulation: clinicalCase.content.simulation,
    };

    const definition: SimulationCaseDefinition | undefined = SimulationCaseMapper.toDefinition(snapshot);

    if (!definition) {
      throw new Error(`Demo clinical case ${row.id} is not simulation ready`);
    }

    definitions.set(row.id, definition);
  }

  return definitions;
}

function summarize(definition: SimulationCaseDefinition, seed: SessionSeed, events: readonly EventSeed[], startedAt: Date, endedAt: Date): SimulationSessionSummary {
  const result: ReplayResult = replay(
    definition.engineCase,
    seed.seed,
    events
      .filter((event: EventSeed): boolean => event.type === "PARAM_CHANGE")
      .map((event: EventSeed) => ({ type: "PARAM_CHANGE" as const, simTimeMs: event.simTimeMs, changes: event.payload.changes as Partial<VentilatorSettings> })),
    SIMULATED_MS,
    { timeMultiplier: 1 },
  );

  const aiHelpCount: number = events.filter((event: EventSeed): boolean => event.type === "AI_HELP").length;
  const score: SimulationScore = computeSimulationScore(result, buildDefaultSimulationRubric(DEFAULT_SIMULATION_RUBRIC_THRESHOLDS), { aiHelpCount });

  return {
    engineVersion: ENGINE_VERSION,
    simTimeMs: SIMULATED_MS,
    durationMs: endedAt.getTime() - startedAt.getTime(),
    finalMetrics: result.final,
    targets: result.final.targets,
    score: score.score,
    breakdown: score.breakdown,
    aiHelpCount,
  };
}

export async function seedSimulationSessions(db: DemoDb, context: DemoContext): Promise<void> {
  const definitions: Map<string, SimulationCaseDefinition> = await loadDefinitions(db);

  for (const seed of sessionSeeds()) {
    const definition: SimulationCaseDefinition | undefined = definitions.get(seed.caseId);

    if (!definition) {
      throw new Error(`Demo clinical case ${seed.caseId} was not seeded`);
    }

    const sessionId: string = demoId(`simulation-session:${seed.key}`);
    const events: EventSeed[] = eventsOf(seed);
    const startedAt: Date = context.clock.at(seed.day, seed.hour);
    const endedAt: Date = addMinutes(startedAt, 4);
    const lastEvent: EventSeed | undefined = events.at(-1);
    const lastSimTimeMs: number = lastEvent?.simTimeMs ?? 0;
    const summary: SimulationSessionSummary | undefined = seed.abandoned ? undefined : summarize(definition, seed, events, startedAt, endedAt);

    const session: Prisma.SimulationSessionCreateManyInput = {
      id: sessionId,
      userId: seed.student.id,
      caseId: seed.caseId,
      mode: "FREE",
      seed: seed.seed,
      engineVersion: ENGINE_VERSION,
      timeMultiplier: 1,
      status: seed.abandoned ? "ABANDONED" : "ENDED",
      startedAt,
      endedAt: seed.abandoned ? undefined : endedAt,
      lastEventAt: addMinutes(startedAt, lastSimTimeMs / 60_000),
      lastSimTimeMs,
      summary: summary ? (summary as unknown as Prisma.InputJsonObject) : undefined,
    };

    await db.simulationSession.upsert({ where: { id: sessionId }, create: session, update: session });

    const rows: Prisma.SimulationEventCreateManyInput[] = events.map((event: EventSeed, index: number): Prisma.SimulationEventCreateManyInput => ({
      id: demoId(`simulation-event:${seed.key}:${index + 1}`),
      sessionId,
      simTimeMs: event.simTimeMs,
      type: event.type,
      payload: event.payload,
      receivedAt: addMinutes(startedAt, event.simTimeMs / 60_000),
    }));

    await upsertAll(rows, (row: Prisma.SimulationEventCreateManyInput, id: string) => db.simulationEvent.upsert({ where: { id }, create: row, update: row }));
  }
}
