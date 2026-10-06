/*
 * Funcionalidad: Puerto IAITextGenerator
 * Descripción: Define el contrato, opciones, resultado y token de inyección del generador de texto con modelos de lenguaje
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface AITextGenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AITextGenerationResult {
  text: string;
  model: string;
}

export const AI_TEXT_GENERATOR_TOKEN: unique symbol = Symbol("AI_TEXT_GENERATOR_TOKEN");

export interface IAITextGenerator {
  isAvailable(): boolean;
  generate(prompt: string, options?: AITextGenerationOptions): Promise<AITextGenerationResult>;
}
