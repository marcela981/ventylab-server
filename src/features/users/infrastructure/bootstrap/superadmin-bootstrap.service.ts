/*
 * Funcionalidad: Servicio SuperadminBootstrapService
 * Descripción: Al arrancar la aplicación ejecuta EnsureSuperadminUseCase para que la cuenta del superadmin, si existe, quede con rol ADMIN y activa; registra el resultado con el Logger de Nest sin exponer datos de la cuenta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";

import { EnsureSuperadminUseCase, type EnsureSuperadminOutcome } from "@/features/users/application/use-cases/ensure-superadmin.usecase";

const OUTCOME_MESSAGES: Readonly<Record<EnsureSuperadminOutcome, string>> = {
  not_configured: "Superadmin email is not configured",
  not_found: "Superadmin account does not exist yet; it will be created as ADMIN on registration",
  unchanged: "Superadmin account already has the ADMIN role and is active",
  updated: "Superadmin account was set to the ADMIN role and activated",
};

@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly _logger: Logger = new Logger(SuperadminBootstrapService.name);

  public constructor(private readonly _ensureSuperadminUseCase: EnsureSuperadminUseCase) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      const outcome: EnsureSuperadminOutcome = await this._ensureSuperadminUseCase.execute();

      this._logger.log(OUTCOME_MESSAGES[outcome]);
    } catch (error) {
      this._logger.error(`Superadmin bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
