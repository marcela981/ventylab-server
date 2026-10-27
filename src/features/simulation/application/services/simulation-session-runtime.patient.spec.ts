/*
 * Funcionalidad: Pruebas del paciente propio en la repetición de sesiones
 * Descripción: Verifica que el contexto de una sesión con paciente propio reconstruya el mismo caso del motor devuelto al iniciarla, que la repetición con la misma semilla dé el mismo resultado que el motor con ese caso y distinto del caso base, que el registro de eventos use los ajustes iniciales del paciente y que una sesión sin paciente siga usando el caso tal cual
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { StartSimulationSessionCommand } from "@/features/simulation/application/commands/start-simulation-session.command";
import { type StartSimulationSessionResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationSessionContext } from "@/features/simulation/application/services/simulation-session-runtime.service";
import {
  createSimulationTestContext,
  FixedSeedGenerator,
  normalLungSnapshot,
  type SimulationTestContext,
  storeSession,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { StartSimulationSessionUseCase } from "@/features/simulation/application/use-cases/start-simulation-session.usecase";
import { replay, type ReplayResult } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";

const REPLAY_MS: number = 60_000;

const PATIENT: SimulatedPatient = {
  ageYears: 72,
  sex: "FEMALE",
  weightKg: 95,
  heightCm: 158,
  condition: "ARDS_MODERATE",
  difficulty: "ADVANCED",
  vitals: { respiratoryRateBpm: 26, spo2Percent: 86, systolicMmHg: 100, diastolicMmHg: 60 },
};

describe("SimulationSessionRuntime with an own patient", () => {
  let context: SimulationTestContext;

  beforeEach(() => {
    useFixedClock(new Date("2026-10-26T12:00:00Z"));
    context = createSimulationTestContext();
    context.clinicalCases.cases.set("july-sdra-sepsis", normalLungSnapshot({ id: "july-sdra-sepsis" }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function startWithPatient(): Promise<StartSimulationSessionResult> {
    const useCase: StartSimulationSessionUseCase = new StartSimulationSessionUseCase(
      context.repository,
      context.examReader,
      new FixedSeedGenerator(),
      context.transactionManager,
      context.clinicalCases.asFacade(),
      context.runtime,
    );

    return await useCase.execute(new StartSimulationSessionCommand({ userId: "student-1", mode: "FREE", timeMultiplier: 1, patient: PATIENT }));
  }

  it("rebuilds the engine case returned when the session started", async () => {
    const started: StartSimulationSessionResult = await startWithPatient();
    const stored: SimulationSession = await context.runtime.getSession(started.session.id);

    const sessionContext: SimulationSessionContext = await context.runtime.loadContext(stored);

    expect(sessionContext.caseDefinition.engineCase).toEqual(started.engineCase);
    expect(sessionContext.caseDefinition.summary.patient).toEqual({ sex: "FEMALE", ageYears: 72, heightCm: 158, weightKg: 95 });
  });

  it("replays the same patient with the same seed, unlike the base case", async () => {
    const started: StartSimulationSessionResult = await startWithPatient();
    const sessionContext: SimulationSessionContext = await context.runtime.loadContext(await context.runtime.getSession(started.session.id));

    const replayed: ReplayResult = context.runtime.replay(sessionContext, REPLAY_MS);
    const direct: ReplayResult = replay(started.engineCase, started.session.seed, [], REPLAY_MS, { timeMultiplier: 1 });
    const baseContext: SimulationSessionContext = await context.runtime.loadContext(await storeSession(context, { caseId: "july-sdra-sepsis" }));

    expect(replayed.final).toEqual(direct.final);
    expect(context.runtime.replay(baseContext, REPLAY_MS).final).not.toEqual(replayed.final);
  });

  it("keeps the overrides stored with the session even if the base case changes later", async () => {
    const started: StartSimulationSessionResult = await startWithPatient();

    context.clinicalCases.cases.set("july-sdra-sepsis", normalLungSnapshot({ id: "july-sdra-sepsis", patientAge: 30 }));

    const sessionContext: SimulationSessionContext = await context.runtime.loadContext(await context.runtime.getSession(started.session.id));

    expect(sessionContext.caseDefinition.engineCase.mechanics).toEqual(started.engineCase.mechanics);
    expect(sessionContext.caseDefinition.summary.patient?.ageYears).toBe(72);
  });

  it("loads a session without patient on its case as is", async () => {
    const session: SimulationSession = await storeSession(context);

    const sessionContext: SimulationSessionContext = await context.runtime.loadContext(session);

    expect(sessionContext.caseDefinition.engineCase.mechanics).toEqual({ complianceMlPerCmH2O: 60, resistanceCmH2OPerLps: 8 });
  });
});
