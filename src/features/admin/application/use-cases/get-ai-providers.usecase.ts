/*
 * Funcionalidad: Caso de uso GetAiProvidersUseCase
 * Descripción: Devuelve el catálogo de proveedores de IA para el administrador a través de AiGateway: si cada proveedor tiene credenciales configuradas (sin exponerlas) y los modelos conocidos por la feature de IA, sin llamar a ningún proveedor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiProviderCatalogEntry } from "@/features/ai/domain/results/ai-provider-health";

@Injectable()
export class GetAiProvidersUseCase {
  public constructor(private readonly _aiGateway: AiGateway) {}

  public execute(): AiProviderCatalogEntry[] {
    return this._aiGateway.getProviderCatalog();
  }
}
