/*
 * Funcionalidad: Prompts versionados del simulador
 * Descripción: Plantillas de los casos de uso del simulador en el registro de prompts: interpretación del caso al iniciar una sesión (SIM_CASE_INTERPRETATION, salida JSON estricta con los parámetros del motor que la IA puede ajustar dentro de las bandas permitidas) y ayuda de alarmas "¿Cómo estabilizar?" (SIM_ALARM_HELP, texto breve que complementa las reglas deterministas); la historia clínica, el estado y las reglas van delimitados como datos; v1.1: SIM_ASSIST 1.3.0 y SIM_ALARM_HELP 1.1.0 (se conservan 1.2.0 y 1.0.0): el estado actual va en <estado_actual> con su tiempo simulado, la instrucción explícita de razonar solo sobre ese estado y de priorizar la estabilización con el paciente crítico o con alarmas de prioridad alta, el límite del bloque nunca corta el estado (que ya se recorta por estructura) y una nota correctiva opcional para la regeneración tras una respuesta incoherente
 * Versión: 1.1
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
export const SIM_ALARM_HELP_PROMPT_VERSION: string = "1.1.0";
export const SIM_ALARM_HELP_LEGACY_PROMPT_VERSION: string = "1.0.0";
export const SIM_ASSIST_PROMPT_VERSION: string = "1.3.0";
export const SIM_ASSIST_LEGACY_PROMPT_VERSION: string = "1.2.0";

/** Block limit of the current-state prompts: above the structural cap of the state, so the block never cuts it */
const CURRENT_STATE_BLOCK_MAX_LENGTH: number = 8000;
const CORRECTION_MAX_LENGTH: number = 600;
const SIM_ASSIST_QUESTION_MAX_LENGTH: number = 1000;
const SIM_ASSIST_DEFAULT_QUESTION: string = "(Sin pregunta: analiza el estado actual de la simulación.)";

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
  /** Template version to build; omitted, the current one */
  readonly promptVersion?: string;
  /** Regeneration after an incoherent answer: what the previous answer got wrong */
  readonly correction?: string;
}

export interface SimAssistCurrentStatePromptInput {
  readonly simulationState: string;
  readonly question: string;
  readonly language?: LanguageValue;
  readonly correction?: string;
}

const CURRENT_STATE_RULES: readonly string[] = [
  "Basa el análisis SOLO en el estado actual del bloque <estado_actual> (su campo simTime es el tiempo simulado de este momento): no supongas valores iniciales del caso ni de respuestas anteriores.",
  "Si el paciente está crítico (patient.critical true, estado CRITICAL, ARREST o DECEASED) o hay alarmas de prioridad HIGH, empieza por las acciones de estabilización y nunca digas que el paciente está estable.",
  "Cita los valores tal como aparecen en el estado actual; una tendencia (trendSlopes, trends) describe cómo llegó a ese valor.",
];

const CORRECTION_PREFIX: string = "Tu respuesta anterior contradecía el estado actual. Corrige esto y responde de nuevo desde cero:";

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

const ALARM_HELP_CURRENT_STATE_INSTRUCTIONS: string = [...ALARM_HELP_INSTRUCTIONS.split("\n"), ...CURRENT_STATE_RULES].join("\n");

const SIM_ASSIST_CURRENT_STATE_INSTRUCTIONS: string = [
  "Eres un tutor que acompaña al estudiante mientras ajusta un ventilador simulado o un equipo de laboratorio (estado con source REAL_VENTILATOR). Tu objetivo es que aprenda a razonar, no resolverle el caso.",
  ...CURRENT_STATE_RULES,
  "1. Di en una frase cómo está el paciente ahora (estado, gravedad y alarmas activas).",
  "2. Si está crítico o hay alarmas de prioridad alta, propón primero como máximo tres acciones de estabilización priorizadas; si no, señala qué está bien (objetivos cumplidos, presiones seguras) y por qué.",
  "3. Explica qué está mal o en riesgo (alarmas, presión meseta o de distensión altas, volumen por kg excesivo, auto-PEEP, oxigenación o ventilación fuera de objetivo) y qué mecanismo fisiológico lo explica, relacionándolo con los últimos ajustes del usuario y las tendencias.",
  "4. Para cada sugerencia di qué variable revisar, en qué dirección y qué se espera ver en las curvas y en el monitor si funciona; no dictes el valor exacto a programar.",
  "5. Si el estudiante hace una pregunta, respóndela con ese mismo enfoque guiado.",
  "Sé breve. Usa solo los datos del estado actual y dilo cuando falte información. Si el estado trae unsentChanges true, advierte que los últimos cambios del usuario quizá no estén incluidos. Si trae stale true (equipo sin datos), dilo primero. No des indicaciones para pacientes reales.",
].join("\n");

function correctionBlock(correction: string | undefined): string[] {
  return correction === undefined || correction.trim().length === 0 ? [] : [delimit("nota_correctiva", `${CORRECTION_PREFIX} ${correction}`, CORRECTION_MAX_LENGTH)];
}

/** SIM_ASSIST 1.3.0: the current state with its simulated time, current-state rules and an optional correction */
export function buildSimAssistCurrentStatePrompt(input: SimAssistCurrentStatePromptInput): BuiltPrompt {
  return {
    system: withCommonSystemPrompt(SIM_ASSIST_CURRENT_STATE_INSTRUCTIONS, input.language),
    messages: [
      {
        role: "user",
        content: [
          delimit("estado_actual", input.simulationState, CURRENT_STATE_BLOCK_MAX_LENGTH),
          delimit("pregunta", input.question.trim().length > 0 ? input.question : SIM_ASSIST_DEFAULT_QUESTION, SIM_ASSIST_QUESTION_MAX_LENGTH),
          ...correctionBlock(input.correction),
        ].join("\n\n"),
      },
    ],
    responseFormat: "text",
  };
}

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
  if ((input.promptVersion ?? SIM_ALARM_HELP_PROMPT_VERSION) === SIM_ALARM_HELP_LEGACY_PROMPT_VERSION) {
    return buildLegacySimAlarmHelpPrompt(input);
  }

  return {
    system: withCommonSystemPrompt(ALARM_HELP_CURRENT_STATE_INSTRUCTIONS, input.language),
    messages: [
      {
        role: "user",
        content: [
          delimit("alarma", input.alarm, 200),
          delimit("estado_actual", input.monitorState, CURRENT_STATE_BLOCK_MAX_LENGTH),
          delimit("reglas_deterministas", input.rules, ALARM_RULES_MAX_LENGTH),
          ...correctionBlock(input.correction),
        ].join("\n\n"),
      },
    ],
    responseFormat: "text",
  };
}

/** SIM_ALARM_HELP 1.0.0 (kept for reproducibility): its state block is cut at ALARM_STATE_MAX_LENGTH characters */
export function buildLegacySimAlarmHelpPrompt(input: SimAlarmHelpPromptInput): BuiltPrompt {
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
