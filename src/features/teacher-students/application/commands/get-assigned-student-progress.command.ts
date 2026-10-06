/*
 * Funcionalidad: Comando GetAssignedStudentProgressCommand
 * Descripción: Datos para consultar el progreso detallado de un estudiante desde la ruta de un profesor, con el rol de quien consulta para aplicar la verificación de asignación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GetAssignedStudentProgressCommand {
  public readonly teacherId: string;
  public readonly studentId: string;
  public readonly requesterRole: string;

  public constructor({ teacherId, studentId, requesterRole }: { teacherId: string; studentId: string; requesterRole: string }) {
    this.teacherId = teacherId;
    this.studentId = studentId;
    this.requesterRole = requesterRole;
  }
}
