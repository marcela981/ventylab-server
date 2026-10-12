/*
 * Funcionalidad: Caso de uso ProbeAiProviderUseCase
 * Descripción: Ejecuta a través de AiGateway una llamada real mínima a un proveedor de IA (registrada en la telemetría) y pide reevaluar el estado del sistema para reflejar el nuevo estado de su cortocircuito
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiProbeResult } from "@/features/ai/domain/results/ai-provider-health";
import { SystemStatusMonitor } from "@/features/system-status/application/services/system-status-monitor.service";

/**
 * @throws {UnknownAiProviderError} If the provider is not one the gateway knows
 * @throws {AiProviderNotRegisteredError} If the provider has no configuration
 */
@Injectable()
export class ProbeAiProviderUseCase {
  public constructor(
    private readonly _aiGateway: AiGateway,
    private readonly _monitor: SystemStatusMonitor,
  ) {}

  public async execute(provider: string): Promise<AiProbeResult> {
    const result: AiProbeResult = await this._aiGateway.probe(provider);

    this._monitor.reevaluate();

    return result;
  }
}
