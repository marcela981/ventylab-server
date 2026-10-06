/*
 * Funcionalidad: Comando RemoveTeacherStudentCommand
 * Descripción: Datos para eliminar una relación profesor-estudiante por su ID
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RemoveTeacherStudentCommand {
  public readonly relationshipId: string;
  public readonly performedBy: string;

  public constructor({ relationshipId, performedBy }: { relationshipId: string; performedBy: string }) {
    this.relationshipId = relationshipId;
    this.performedBy = performedBy;
  }
}
