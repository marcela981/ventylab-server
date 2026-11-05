/*
 * Funcionalidad: Prompts versionados del simulador
 * Descripción: Plantillas de los casos de uso del simulador en el registro de prompts: interpretación del caso al iniciar una sesión (SIM_CASE_INTERPRETATION, salida JSON estricta con los parámetros del motor que la IA puede ajustar dentro de las bandas permitidas) y ayuda de alarmas "¿Cómo estabilizar?" (SIM_ALARM_HELP, texto breve que complementa las reglas deterministas); la historia clínica, el estado y las reglas van delimitados como datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { withCommonSystemPrompt } from "@/features/ai/domain/prompts/common-system-prompt";
import { delimit } from "@/features/ai/domain/prompts/delimit";
import { type BuiltPrompt } from "@/features/ai/domain/prompts/prompt-template";

export const SIM_CASE_INTERPRETATION_PROMPT_VERSION: string = "1.0.0";
export const SIM_ALARM_HELP_PROMPT_VERSION: string = "1.0.0";

const CASE_HISTORY_MAX_LENGTH: number = 4000;
const CURATED_PARAMETERS_MAX_LENGTH: number = 2000;
const ALARM_STATE_MAX_LENGTH: number = 3000;
const ALARM_RULES_MAX_LENGTH: number = 2000;

export interface SimCaseInterpretationPromptInput {
  /** Clinical history of the case or own patient, without personal data */
  readonly clinicalHistory: string;
  /** JSON with each adjustable parameter: curated value, allowed band and unit */
  readonly curatedParameters: string;
  readonly language?: LanguageValue;
}

export interface SimAlarmHelpPromptInput {
  readonly alarm: string;
  readonly monitorState: string;
  readonly rules: string;
  readonly language?: LanguageValue;
}

const CASE_INTERPRETATION_INSTRUCTIONS: string = [
  "Eres un intensivista que configura un simulador educativo de ventilación mecánica a partir de una historia clínica.",
  "Lee la historia clínica y los parámetros curados del caso. Para cada parámetro propone un valor coherente con la historia, siempre dentro de la banda permitida que se indica; si la historia no aporta información para un parámetro, devuelve el valor curado.",
  "Responde SOLO con un objeto JSON, sin markdown ni texto adicional, con esta forma exacta:",
  "{\"complianceMlPerCmH2O\": number, \"resistanceCmH2OPerLps\": number, \"deadSpaceMl\": number, \"vco2MlPerMin\": number, \"shuntScale\": number, \"baselineMapMmHg\": number, \"baselineHeartRateBpm\": number, \"trajectory\": \"STABLE\" | \"WORSENING\" | \"IMPROVING\", \"rationale\": string}",
  "shuntScale multiplica la curva de shunt del caso (1 = sin cambio). trajectory describe la evolución esperada sin tratamiento. rationale explica en una o dos frases de dónde salen los ajustes.",
  "No inventes datos del paciente ni des indicaciones para pacientes reales.",
].join("\n");

const ALARM_HELP_INSTRUCTIONS: string = [
  "Eres un tutor que ayuda a un estudiante a responder una alarma del ventilador (simulado o un equipo de laboratorio).",
  "Ya recibió las reglas deterministas de la alarma: no las repitas; complétalas con lo que el estado del monitor sugiere en este momento.",
  "1. Di en una frase qué causa probable sugiere el estado (presiones, volúmenes, gases, hemodinamia, cambios recientes).",
  "2. Propón como máximo tres acciones priorizadas: qué revisar o cambiar, en qué dirección y por qué; no dictes el valor exacto a programar.",
  "3. Di qué esperar ver en las curvas y en el monitor si la acción funciona.",
  "Sé breve. Usa solo los datos del estado y dilo cuando falte información. No des indicaciones para pacientes reales: la decisión es del usuario.",
].join("\n");

export function buildSimCaseInterpretationPrompt(input: SimCaseInterpretationPromptInput): BuiltPrompt {
  return {
    system: withCommonSystemPrompt(CASE_INTERPRETATION_INSTRUCTIONS, input.language),
    messages: [
      {
        role: "user",
        content: [
          delimit("historia_clinica", input.clinicalHistory, CASE_HISTORY_MAX_LENGTH),
          delimit("parametros_curados", input.curatedParameters, CURATED_PARAMETERS_MAX_LENGTH),
        ].join("\n\n"),
      },
    ],
    responseFormat: "json",
  };
}

export function buildSimAlarmHelpPrompt(input: SimAlarmHelpPromptInput): BuiltPrompt {
  return {
    system: withCommonSystemPrompt(ALARM_HELP_INSTRUCTIONS, input.language),
    messages: [
      {
        role: "user",
        content: [
          delimit("alarma", input.alarm, 200),
          delimit("estado_monitor", input.monitorState, ALARM_STATE_MAX_LENGTH),
          delimit("reglas_deterministas", input.rules, ALARM_RULES_MAX_LENGTH),
        ].join("\n\n"),
      },
    ],
    responseFormat: "text",
  };
}
