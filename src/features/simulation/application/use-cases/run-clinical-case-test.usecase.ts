/*
 * Funcionalidad: Caso de uso RunClinicalCaseTestUseCase
 * Descripción: Prueba un caso clínico en cualquier estado para docentes y administradores: lo carga con ClinicalCasesFacade, lo convierte al caso del motor y repite la simulación sin intervención durante los segundos pedidos con la semilla dada o una generada por el servidor, devolviendo la línea de tiempo de métricas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type RunClinicalCaseTestCommand } from "@/features/simulation/application/commands/run-clinical-case-test.command";
import {
  type ISimulationSeedGenerator,
  SIMULATION_SEED_GENERATOR_TOKEN,
} from "@/features/simulation/application/ports/simulation-seed-generator.interface";
import { type ClinicalCaseTestRunResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { ENGINE_VERSION, EngineValidationError, replay, type ReplayResult } from "@/features/simulation/domain/engine";
import { SimulationCaseNotReadyError } from "@/features/simulation/domain/simulation.errors";

const MS_PER_SECOND: number = 1000;

/**
 * @throws {SimulationCaseNotFoundError} If the clinical case does not exist
 * @throws {SimulationCaseNotReadyError} If the case lacks its simulation profile or the engine rejects it
 */
@Injectable()
export class RunClinicalCaseTestUseCase {
  public constructor(
    @Inject(SIMULATION_SEED_GENERATOR_TOKEN)
    private readonly _seedGenerator: ISimulationSeedGenerator,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(command: RunClinicalCaseTestCommand): Promise<ClinicalCaseTestRunResult> {
    const caseDefinition: SimulationCaseDefinition = await this._runtime.loadCase(command.caseId);
    const seed: number = command.seed ?? this._seedGenerator.next();
    let result: ReplayResult;

    try {
      result = replay(caseDefinition.engineCase, seed, [], command.seconds * MS_PER_SECOND);
    } catch (error: unknown) {
      if (error instanceof EngineValidationError) {
        throw new SimulationCaseNotReadyError();
      }

      throw error;
    }

    return { engineVersion: ENGINE_VERSION, seconds: command.seconds, seed, metricsTimeline: result.metricsTimeline };
  }
}
