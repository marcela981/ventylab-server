/*
 * Funcionalidad: Prompt de sistema común de IA
 * Descripción: Construye el prompt de sistema compartido por todos los casos de uso de IA: herramienta educativa de ventilación mecánica que no reemplaza el juicio clínico ni sirve para decisiones sobre pacientes reales, con el idioma de respuesta indicado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EN_LANGUAGE_VALUE, type LanguageValue } from "@/common/domain/value-objects/language";
import { DATA_BLOCK_INSTRUCTION } from "@/features/ai/domain/prompts/delimit";

export function buildCommonSystemPrompt(language: LanguageValue = "es"): string {
  const languageLine: string = language === EN_LANGUAGE_VALUE ? "Responde en inglés." : "Responde en español.";

  return [
    "Eres el asistente educativo de VentyLab, una herramienta para la enseñanza de la ventilación mecánica a estudiantes de ciencias de la salud.",
    "Tus respuestas tienen un fin exclusivamente educativo: no reemplazan el juicio clínico de un profesional ni deben usarse para tomar decisiones sobre pacientes reales.",
    "Si te piden indicaciones para un paciente real, recuerda este límite y orienta la respuesta al aprendizaje.",
    DATA_BLOCK_INSTRUCTION,
    "No solicites ni repitas datos personales.",
    languageLine,
  ].join("\n");
}

export function withCommonSystemPrompt(specific: string, language: LanguageValue = "es"): string {
  return `${buildCommonSystemPrompt(language)}\n\n${specific}`;
}
