/*
 * Funcionalidad: Comando ChangeUserStudentCodeCommand
 * Descripción: Datos para asignar, cambiar o quitar (null) el código estudiantil de un usuario por parte de un administrador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ChangeUserStudentCodeCommand {
  public readonly userId: string;
  public readonly studentCode: string | null;
  public readonly performedBy: string;

  public constructor({ userId, studentCode, performedBy }: { userId: string; studentCode: string | null; performedBy: string }) {
    this.userId = userId;
    this.studentCode = studentCode;
    this.performedBy = performedBy;
  }
}
