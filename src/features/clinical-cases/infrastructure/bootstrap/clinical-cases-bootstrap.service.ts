/*
 * Funcionalidad: Servicio ClinicalCasesBootstrapService
 * Descripción: Al arrancar la aplicación inserta los casos clínicos que el simulador necesita y que aún no existen (los tres de julio y los cuatro casos base del motor que usa el paciente propio), sin actualizar nunca uno existente; registra el resultado con el Logger de Nest y un fallo no impide el arranque
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";

import {
  EnsureSeedClinicalCasesUseCase,
  type SeedClinicalCase,
  type SeedClinicalCasesOutcome,
} from "@/features/clinical-cases/application/use-cases/ensure-seed-clinical-cases.usecase";
import { ENGINE_READY_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";
import { JULY_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/persistence/seed/july-clinical-cases.data";

export const BOOTSTRAP_CLINICAL_CASES: readonly SeedClinicalCase[] = [...JULY_CLINICAL_CASES, ...ENGINE_READY_CLINICAL_CASES];

@Injectable()
export class ClinicalCasesBootstrapService implements OnApplicationBootstrap {
  private readonly _logger: Logger = new Logger(ClinicalCasesBootstrapService.name);

  public constructor(private readonly _ensureSeedClinicalCasesUseCase: EnsureSeedClinicalCasesUseCase) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      const outcome: SeedClinicalCasesOutcome = await this._ensureSeedClinicalCasesUseCase.execute(BOOTSTRAP_CLINICAL_CASES);

      this._logger.log(`Seed clinical cases: ${outcome.inserted.length} inserted, ${outcome.existing.length} already present`);
    } catch (error) {
      this._logger.error(`Clinical cases bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
