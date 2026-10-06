/*
 * Funcionalidad: Validación de respuestas de evaluación
 * Descripción: Función pura que comprueba que una respuesta coincide con el tipo de su pregunta (SINGLE_CHOICE y TRUE_FALSE exactamente una opción, MULTIPLE_CHOICE cero o más distintas, OPEN_TEXT texto con límite, SIMULATION una sesión del simulador), que las opciones pertenecen a la pregunta y que no trae campos de otro tipo; devuelve la respuesta normalizada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationOptionItem, type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { InvalidEvaluationAnswerError } from "@/features/evaluation/domain/evaluation.errors";
import {
  isChoiceQuestionType,
  MULTIPLE_CHOICE_QUESTION_TYPE,
  OPEN_TEXT_QUESTION_TYPE,
} from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export const MAX_OPEN_TEXT_ANSWER_LENGTH: number = 10_000;

export interface EvaluationAnswerInput {
  readonly selectedOptionIds?: ReadonlyArray<string>;
  readonly textAnswer?: string;
  readonly simulationSessionId?: string;
}

export interface ValidatedEvaluationAnswer {
  readonly selectedOptionIds: string[];
  readonly textAnswer?: string;
  readonly simulationSessionId?: string;
}

function validateChoice(question: EvaluationQuestionItem, input: EvaluationAnswerInput): ValidatedEvaluationAnswer {
  if (input.textAnswer !== undefined || input.simulationSessionId !== undefined) {
    throw new InvalidEvaluationAnswerError("fields_not_allowed");
  }

  const selected: string[] = [...(input.selectedOptionIds ?? [])];

  if (new Set<string>(selected).size !== selected.length) {
    throw new InvalidEvaluationAnswerError("option_duplicated");
  }

  if (question.type !== MULTIPLE_CHOICE_QUESTION_TYPE && selected.length !== 1) {
    throw new InvalidEvaluationAnswerError("option_count_invalid");
  }

  const optionIds: Set<string> = new Set<string>(question.options.map((option: EvaluationOptionItem) => option.id));

  if (selected.some((id: string) => !optionIds.has(id))) {
    throw new InvalidEvaluationAnswerError("option_not_in_question");
  }

  return { selectedOptionIds: selected };
}

function validateOpenText(input: EvaluationAnswerInput): ValidatedEvaluationAnswer {
  if ((input.selectedOptionIds?.length ?? 0) > 0 || input.simulationSessionId !== undefined) {
    throw new InvalidEvaluationAnswerError("fields_not_allowed");
  }

  if (input.textAnswer === undefined) {
    throw new InvalidEvaluationAnswerError("text_required");
  }

  if (input.textAnswer.length > MAX_OPEN_TEXT_ANSWER_LENGTH) {
    throw new InvalidEvaluationAnswerError("text_too_long");
  }

  return { selectedOptionIds: [], textAnswer: input.textAnswer };
}

function validateSimulation(input: EvaluationAnswerInput): ValidatedEvaluationAnswer {
  if ((input.selectedOptionIds?.length ?? 0) > 0 || input.textAnswer !== undefined) {
    throw new InvalidEvaluationAnswerError("fields_not_allowed");
  }

  if (input.simulationSessionId === undefined || input.simulationSessionId.length === 0) {
    throw new InvalidEvaluationAnswerError("session_required");
  }

  return { selectedOptionIds: [], simulationSessionId: input.simulationSessionId };
}

export function validateEvaluationAnswer(question: EvaluationQuestionItem, input: EvaluationAnswerInput): ValidatedEvaluationAnswer {
  if (isChoiceQuestionType(question.type)) {
    return validateChoice(question, input);
  }

  if (question.type === OPEN_TEXT_QUESTION_TYPE) {
    return validateOpenText(input);
  }

  return validateSimulation(input);
}
