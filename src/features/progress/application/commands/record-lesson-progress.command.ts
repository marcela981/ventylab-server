/*
 * Funcionalidad: Comando RecordLessonProgressCommand
 * Descripción: Datos para registrar avance o completitud de una lección identificada por su id o por un id heredado del frontend
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RecordLessonProgressCommand {
  public readonly userId: string;
  public readonly lessonReference: string;
  public readonly moduleIdHint?: string;
  public readonly completed: boolean;
  public readonly timeSpent: number;
  public readonly currentStep?: number;
  public readonly totalSteps?: number;
  public readonly quizScore?: number;

  public constructor({
    userId,
    lessonReference,
    moduleIdHint,
    completed,
    timeSpent,
    currentStep,
    totalSteps,
    quizScore,
  }: {
    userId: string;
    lessonReference: string;
    moduleIdHint?: string;
    completed: boolean;
    timeSpent: number;
    currentStep?: number;
    totalSteps?: number;
    quizScore?: number;
  }) {
    this.userId = userId;
    this.lessonReference = lessonReference;
    this.moduleIdHint = moduleIdHint;
    this.completed = completed;
    this.timeSpent = timeSpent;
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;
    this.quizScore = quizScore;
  }
}
