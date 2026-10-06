/*
 * Funcionalidad: Comando StartEvaluationAttemptCommand
 * Descripción: Intención de un estudiante de iniciar (o retomar) su intento en una asignación de evaluación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class StartEvaluationAttemptCommand {
  public readonly assignmentId: string;
  public readonly userId: string;

  public constructor({ assignmentId, userId }: { assignmentId: string; userId: string }) {
    this.assignmentId = assignmentId;
    this.userId = userId;
  }
}
