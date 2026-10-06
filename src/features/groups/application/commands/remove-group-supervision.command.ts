/*
 * Funcionalidad: Comando RemoveGroupSupervisionCommand
 * Descripción: Datos para quitar el vínculo de supervisión entre un grupo TEACHER y un grupo STUDENT
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RemoveGroupSupervisionCommand {
  public readonly teacherGroupId: string;
  public readonly studentGroupId: string;
  public readonly performedBy: string;

  public constructor({
    teacherGroupId,
    studentGroupId,
    performedBy,
  }: {
    teacherGroupId: string;
    studentGroupId: string;
    performedBy: string;
  }) {
    this.teacherGroupId = teacherGroupId;
    this.studentGroupId = studentGroupId;
    this.performedBy = performedBy;
  }
}
