/*
 * Funcionalidad: Mapeo del proveedor HTTP personalizado
 * Descripción: Módulo reemplazable que traduce una LlmRequest al cuerpo JSON del servicio HTTP de terceros y su respuesta JSON a LlmCompletion. El contrato de ese servicio es desconocido: la autora debe completar toCustomRequest y fromCustomResponse con el contrato real y poner CUSTOM_HTTP_MAPPING_CONFIGURED en true; mientras tanto ambas funciones lanzan CustomHttpMappingNotConfiguredError y el proveedor no se registra
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { CustomHttpMappingNotConfiguredError } from "@/features/ai/domain/ai.errors";

export const CUSTOM_HTTP_MAPPING_CONFIGURED: boolean = false;

export function toCustomRequest(_request: LlmRequest): unknown {
  throw new CustomHttpMappingNotConfiguredError();
}

export function fromCustomResponse(_json: unknown, _request: LlmRequest): LlmCompletion {
  throw new CustomHttpMappingNotConfiguredError();
}
