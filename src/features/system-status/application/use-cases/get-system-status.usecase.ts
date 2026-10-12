/*
 * Funcionalidad: Caso de uso GetSystemStatusUseCase
 * Descripción: Devuelve el estado del sistema (global y por componente) desde la caché de SystemStatusService o recalculándolo cuando expiró
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { SystemStatusService } from "@/features/system-status/application/services/system-status.service";
import { type SystemStatusReport } from "@/features/system-status/domain/system-status";

@Injectable()
export class GetSystemStatusUseCase {
  public constructor(private readonly _status: SystemStatusService) {}

  public async execute(): Promise<SystemStatusReport> {
    return await this._status.getStatus();
  }
}
