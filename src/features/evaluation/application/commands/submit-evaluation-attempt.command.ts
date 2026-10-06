/*
 * Funcionalidad: Comando SubmitEvaluationAttemptCommand
 * Descripción: Intención de un estudiante de entregar su intento, con respuestas finales opcionales que se aplican antes de cerrar si el plazo (más la gracia) no venció
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentAnswerInput } from "@/features/evaluation/application/services/student-answer-recorder";

export class SubmitEvaluationAttemptCommand {
  public readonly attemptId: string;
  public readonly userId: string;
  public readonly answers?: ReadonlyArray<StudentAnswerInput>;

  public constructor({ attemptId, userId, answers }: { attemptId: string; userId: string; answers?: ReadonlyArray<StudentAnswerInput> }) {
    this.attemptId = attemptId;
    this.userId = userId;
    this.answers = answers;
  }
}
