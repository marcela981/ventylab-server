/*
 * Funcionalidad: Comando AssignStudentCommand
 * Descripción: Datos para asignar un estudiante a un profesor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class AssignStudentCommand {
  public readonly teacherId: string;
  public readonly studentId: string;
  public readonly performedBy: string;

  public constructor({ teacherId, studentId, performedBy }: { teacherId: string; studentId: string; performedBy: string }) {
    this.teacherId = teacherId;
    this.studentId = studentId;
    this.performedBy = performedBy;
  }
}
