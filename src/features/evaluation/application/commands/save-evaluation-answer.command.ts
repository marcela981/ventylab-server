/*
 * Funcionalidad: Comando SaveEvaluationAnswerCommand
 * Descripción: Intención de un estudiante de autoguardar la respuesta a una pregunta de su intento en curso (opciones elegidas, texto o sesión del simulador)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SaveEvaluationAnswerCommand {
  public readonly attemptId: string;
  public readonly questionId: string;
  public readonly userId: string;
  public readonly selectedOptionIds?: string[];
  public readonly textAnswer?: string;
  public readonly simulationSessionId?: string;

  public constructor({
    attemptId,
    questionId,
    userId,
    selectedOptionIds,
    textAnswer,
    simulationSessionId,
  }: {
    attemptId: string;
    questionId: string;
    userId: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
    simulationSessionId?: string;
  }) {
    this.attemptId = attemptId;
    this.questionId = questionId;
    this.userId = userId;
    this.selectedOptionIds = selectedOptionIds;
    this.textAnswer = textAnswer;
    this.simulationSessionId = simulationSessionId;
  }
}
