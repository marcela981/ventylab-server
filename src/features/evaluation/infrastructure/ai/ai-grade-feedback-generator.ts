/*
 * Funcionalidad: Generador de retroalimentación de calificación con IA
 * Descripción: Implementa IGradeFeedbackGenerator sobre el gateway de IA (caso GRADE_FEEDBACK con la retroalimentación determinística como respaldo; la llamada se enlaza al intento con refType evaluation_attempt y refId, que nunca entran al prompt); toma proveedor y modelo del resultado y, si el gateway usa el respaldo, falla (incluida la cuota agotada) o responde algo no interpretable, devuelve la retroalimentación determinística. Solo registra el nombre del error, nunca el prompt ni las respuestas del estudiante. v1.3: entrada estructurada del prompt versionado del registro (GRADE_FEEDBACK 2.0.0); idioma del solicitante (español sin solicitante); atribución de la llamada al estudiante dueño del intento y cuota del solicitante (sin solicitante, llamada de sistema sin cuota); el nombre y el correo del estudiante se eliminan de sus respuestas antes de enviarlas al proveedor
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";

import { ES_LANGUAGE_VALUE } from "@/common/domain/value-objects/language";
import { type AiCallOptions, AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type GradeFeedbackPromptInput } from "@/features/ai/domain/prompts/grade-feedback-prompt";
import { redactableNameTokens, redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type GradeFeedbackGenerationOptions, type IGradeFeedbackGenerator } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { buildDeterministicGradeFeedback, MAX_GRADE } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { parseGradeFeedbackResponse } from "@/features/evaluation/domain/services/grade-feedback-prompt";
import {
  type GeneratedGradeFeedback,
  type GradeFeedbackContent,
  type GradeFeedbackContext,
  type GradeFeedbackQuestionContext,
  LLM_FEEDBACK_SOURCE,
} from "@/features/evaluation/domain/value-objects/grade-feedback";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const GRADE_FEEDBACK_REF_TYPE: string = "evaluation_attempt";

@Injectable()
export class AIGradeFeedbackGenerator implements IGradeFeedbackGenerator {
  private readonly _logger: Logger = new Logger(AIGradeFeedbackGenerator.name);

  public constructor(
    private readonly _aiGateway: AiGateway,
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async generate(context: GradeFeedbackContext, options: GradeFeedbackGenerationOptions): Promise<GeneratedGradeFeedback> {
    const deterministic: GeneratedGradeFeedback = buildDeterministicGradeFeedback(context);
    let result: AiResult;

    try {
      result = await this._aiGateway.complete("GRADE_FEEDBACK", await this._promptInput(context, options), this._callOptions(options, deterministic));
    } catch (error: unknown) {
      this._logger.warn(`Grade feedback generation failed (${error instanceof Error ? error.name : "UnknownError"}); using deterministic feedback`);

      return deterministic;
    }

    if (result.source !== LLM_FEEDBACK_SOURCE) {
      return deterministic;
    }

    const content: GradeFeedbackContent | undefined = parseGradeFeedbackResponse(result.content, context);

    if (!content) {
      this._logger.warn("Grade feedback response was not usable; using deterministic feedback");

      return deterministic;
    }

    return { ...content, source: LLM_FEEDBACK_SOURCE, provider: result.provider, model: result.model };
  }

  private async _promptInput(context: GradeFeedbackContext, options: GradeFeedbackGenerationOptions): Promise<GradeFeedbackPromptInput> {
    const identifiers: string[] = await this._studentIdentifiers(options.studentId);

    return {
      evaluationType: context.evaluation.type,
      evaluationTitle: context.evaluation.title,
      grade: context.grade,
      maxGrade: MAX_GRADE,
      passingGrade: context.passingGrade,
      questions: context.questions.map((question: GradeFeedbackQuestionContext) => ({
        ...question,
        studentAnswerText: redactPersonalData(question.studentAnswerText, identifiers),
      })),
      language: options.requester?.language ?? ES_LANGUAGE_VALUE,
    };
  }

  // Student answers are free text: the student's own name and email are removed before they reach a provider (emails are always stripped).
  private async _studentIdentifiers(studentId: string | undefined): Promise<string[]> {
    if (!studentId) {
      return [];
    }

    try {
      const student: UserAccount | undefined = await this._usersFacade.getUserById(studentId);

      return student ? [student.email, ...redactableNameTokens(student.name)] : [];
    } catch (error: unknown) {
      this._logger.warn(`Could not load the student to redact the grade feedback prompt (${error instanceof Error ? error.name : "UnknownError"})`);

      return [];
    }
  }

  // Attribution goes to the student who owns the attempt; the quota is the requester's (none for a system close).
  private _callOptions(options: GradeFeedbackGenerationOptions, deterministic: GeneratedGradeFeedback): AiCallOptions {
    return {
      fallback: () => JSON.stringify(deterministic),
      refType: GRADE_FEEDBACK_REF_TYPE,
      refId: options.attemptId,
      userId: options.studentId,
      quotaUserId: options.requester?.userId,
      quotaUserRole: options.requester?.role,
    };
  }
}
