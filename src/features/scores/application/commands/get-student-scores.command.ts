/*
 * Funcionalidad: Comando GetStudentScoresCommand
 * Descripción: Datos para consultar las calificaciones de un estudiante según quién consulta (los profesores solo ven las propias)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GetStudentScoresCommand {
  public readonly studentId: string;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({ studentId, requesterId, requesterRole }: { studentId: string; requesterId: string; requesterRole: string }) {
    this.studentId = studentId;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
