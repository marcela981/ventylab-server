/*
 * Funcionalidad: Hash de prompts de IA
 * Descripción: Calcula el SHA-256 del prompt de sistema y los mensajes enviados al proveedor para identificar en la telemetría el prompt exacto usado en cada llamada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";

export function computePromptHash(system: string, messages: readonly AiMessage[]): string {
  return createHash("sha256").update(system + JSON.stringify(messages)).digest("hex");
}
