/*
 * Funcionalidad: Pruebas de RunClinicalCaseTestUseCase
 * Descripción: Verifica que la prueba de un caso clínico devuelve una métrica por segundo simulado con la versión del motor y es determinista con la misma semilla, que usa la semilla del servidor si no se indica, y que rechaza casos inexistentes o sin perfil de simulación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RunClinicalCaseTestCommand } from "@/features/simulation/application/commands/run-clinical-case-test.command";
import { type ClinicalCaseTestRunResult } from "@/features/simulation/application/results/simulation-session.results";
import {
  createSimulationTestContext,
  FixedSeedGenerator,
  normalLungSnapshot,
  type SimulationTestContext,
  TEST_SEED,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { RunClinicalCaseTestUseCase } from "@/features/simulation/application/use-cases/run-clinical-case-test.usecase";
import { ENGINE_VERSION } from "@/features/simulation/domain/engine";
import { SimulationCaseNotFoundError, SimulationCaseNotReadyError } from "@/features/simulation/domain/simulation.errors";

describe("RunClinicalCaseTestUseCase", () => {
  let context: SimulationTestContext;
  let useCase: RunClinicalCaseTestUseCase;

  beforeEach(() => {
    context = createSimulationTestContext();
    useCase = new RunClinicalCaseTestUseCase(new FixedSeedGenerator(), context.runtime);
  });

  it("returns one metrics snapshot per simulated second and is deterministic for a seed", async () => {
    const first: ClinicalCaseTestRunResult = await useCase.execute(new RunClinicalCaseTestCommand({ caseId: "case-normal", seconds: 30, seed: 7 }));
    const second: ClinicalCaseTestRunResult = await useCase.execute(new RunClinicalCaseTestCommand({ caseId: "case-normal", seconds: 30, seed: 7 }));

    expect(first.engineVersion).toBe(ENGINE_VERSION);
    expect(first.seconds).toBe(30);
    expect(first.seed).toBe(7);
    expect(first.metricsTimeline).toHaveLength(30);
    expect(first.metricsTimeline[29].simTimeMs).toBe(30_000);
    expect(second.metricsTimeline).toEqual(first.metricsTimeline);
  });

  it("runs a draft case and uses the server seed when none is given", async () => {
    context.clinicalCases.cases.set("case-draft", normalLungSnapshot({ id: "case-draft", status: "DRAFT" }));

    const result: ClinicalCaseTestRunResult = await useCase.execute(new RunClinicalCaseTestCommand({ caseId: "case-draft", seconds: 2 }));

    expect(result.seed).toBe(TEST_SEED);
    expect(result.metricsTimeline).toHaveLength(2);
  });

  it("rejects an unknown case", async () => {
    await expect(useCase.execute(new RunClinicalCaseTestCommand({ caseId: "missing", seconds: 5 }))).rejects.toBeInstanceOf(SimulationCaseNotFoundError);
  });

  it("rejects a case without a complete simulation profile", async () => {
    const snapshot: ReturnType<typeof normalLungSnapshot> = normalLungSnapshot({ id: "case-legacy" });
    context.clinicalCases.cases.set("case-legacy", { ...snapshot, simulation: { ...snapshot.simulation, mechanics: undefined } });

    await expect(useCase.execute(new RunClinicalCaseTestCommand({ caseId: "case-legacy", seconds: 5 }))).rejects.toBeInstanceOf(
      SimulationCaseNotReadyError,
    );
  });
});
