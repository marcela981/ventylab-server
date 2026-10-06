/*
 * Funcionalidad: Error AIGenerationFailedError
 * Descripción: Error de dominio lanzado cuando el servicio de IA no logra generar una respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class AIGenerationFailedError extends DomainError {
  public constructor() {
    super("The AI service could not generate a response", "common.ai_generation_failed");
  }
}
