/*
 * Funcionalidad: Comando RemoveTeacherStudentByPairCommand
 * Descripción: Datos para eliminar una relación profesor-estudiante por el par profesor y estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RemoveTeacherStudentByPairCommand {
  public readonly teacherId: string;
  public readonly studentId: string;
  public readonly performedBy: string;

  public constructor({ teacherId, studentId, performedBy }: { teacherId: string; studentId: string; performedBy: string }) {
    this.teacherId = teacherId;
    this.studentId = studentId;
    this.performedBy = performedBy;
  }
}
