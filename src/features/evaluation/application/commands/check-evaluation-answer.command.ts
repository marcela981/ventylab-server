/*
 * Funcionalidad: Comando CheckEvaluationAnswerCommand
 * Descripción: Datos para revisar (retroalimentación inmediata) la respuesta de selección a una pregunta del intento propio en curso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CheckEvaluationAnswerCommand {
  public readonly attemptId: string;
  public readonly questionId: string;
  public readonly userId: string;
  public readonly selectedOptionIds: string[];

  public constructor({ attemptId, questionId, userId, selectedOptionIds }: { attemptId: string; questionId: string; userId: string; selectedOptionIds: string[] }) {
    this.attemptId = attemptId;
    this.questionId = questionId;
    this.userId = userId;
    this.selectedOptionIds = selectedOptionIds;
  }
}
