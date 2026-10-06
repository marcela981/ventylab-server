/*
 * Funcionalidad: Comando GradeSubmissionCommand
 * Descripción: Datos para calificar una entrega enviada (puntaje, retroalimentación y docente calificador)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GradeSubmissionCommand {
  public readonly submissionId: string;
  public readonly graderId: string;
  public readonly score: number;
  public readonly feedback?: string;

  public constructor({ submissionId, graderId, score, feedback }: { submissionId: string; graderId: string; score: number; feedback?: string }) {
    this.submissionId = submissionId;
    this.graderId = graderId;
    this.score = score;
    this.feedback = feedback;
  }
}
