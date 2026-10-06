/*
 * Funcionalidad: Comando RemoveActivityAssignmentCommand
 * Descripción: Datos para retirar (borrado lógico) la asignación de una actividad a un grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RemoveActivityAssignmentCommand {
  public readonly assignmentId: string;
  public readonly performedBy: string;
  public readonly requesterRole: string;

  public constructor({ assignmentId, performedBy, requesterRole }: { assignmentId: string; performedBy: string; requesterRole: string }) {
    this.assignmentId = assignmentId;
    this.performedBy = performedBy;
    this.requesterRole = requesterRole;
  }
}
