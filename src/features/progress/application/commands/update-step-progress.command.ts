/*
 * Funcionalidad: Comando UpdateStepProgressCommand
 * Descripción: Datos para registrar la navegación de un usuario a un paso de una lección (índice base cero, total de pasos, tiempo y puntajes opcionales)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateStepProgressCommand {
  public readonly userId: string;
  public readonly moduleId: string;
  public readonly lessonId: string;
  public readonly currentStepIndex: number;
  public readonly totalSteps: number;
  public readonly timeSpentDelta: number;
  public readonly quizScore?: number;

  public constructor({
    userId,
    moduleId,
    lessonId,
    currentStepIndex,
    totalSteps,
    timeSpentDelta,
    quizScore,
  }: {
    userId: string;
    moduleId: string;
    lessonId: string;
    currentStepIndex: number;
    totalSteps: number;
    timeSpentDelta: number;
    quizScore?: number;
  }) {
    this.userId = userId;
    this.moduleId = moduleId;
    this.lessonId = lessonId;
    this.currentStepIndex = currentStepIndex;
    this.totalSteps = totalSteps;
    this.timeSpentDelta = timeSpentDelta;
    this.quizScore = quizScore;
  }
}
