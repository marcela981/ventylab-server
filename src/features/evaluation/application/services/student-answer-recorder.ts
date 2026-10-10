/*
 * Funcionalidad: Registro de respuestas del estudiante
 * Descripción: Valida una respuesta contra su pregunta (pertenencia a la evaluación, forma según el tipo, opciones de la pregunta y vinculación de la sesión de simulación vía ISimulationSessionBindingReader: del mismo estudiante, en modo EXAM y del mismo intento y pregunta) y la guarda en el intento; lo usan el autoguardado y las respuestas finales de la entrega
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type ISimulationSessionBindingReader,
  isSessionBoundTo,
  SIMULATION_SESSION_BINDING_READER_TOKEN,
  type SimulationSessionBinding,
} from "@/features/evaluation/application/ports/simulation-session-binding.interface";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationQuestionNotFoundError, InvalidEvaluationAnswerError } from "@/features/evaluation/domain/evaluation.errors";
import {
  type EvaluationAnswerInput,
  validateEvaluationAnswer,
  type ValidatedEvaluationAnswer,
} from "@/features/evaluation/domain/services/evaluation-answer-validation";

export interface StudentAnswerInput extends EvaluationAnswerInput {
  readonly questionId: string;
}

@Injectable()
export class StudentAnswerRecorder {
  public constructor(
    @Inject(SIMULATION_SESSION_BINDING_READER_TOKEN)
    private readonly _sessionBindingReader: ISimulationSessionBindingReader,
  ) {}

  public async record(attempt: StudentEvaluationAttempt, evaluation: Evaluation, input: StudentAnswerInput, now: Date): Promise<void> {
    const question: EvaluationQuestionItem | undefined = evaluation.questions.find((item: EvaluationQuestionItem) => item.id === input.questionId);

    if (!question) {
      throw new EvaluationQuestionNotFoundError();
    }

    const answer: ValidatedEvaluationAnswer = validateEvaluationAnswer(question, input);

    if (answer.simulationSessionId !== undefined) {
      const binding: SimulationSessionBinding | undefined = await this._sessionBindingReader.getSessionBinding(answer.simulationSessionId, attempt.userId);

      if (!binding || !isSessionBoundTo(binding, { userId: attempt.userId, attemptId: attempt.id, questionId: question.id })) {
        throw new InvalidEvaluationAnswerError("session_not_owned");
      }
    }

    attempt.saveAnswer(question.id, answer, now);
  }
}
