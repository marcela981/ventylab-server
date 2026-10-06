/*
 * Funcionalidad: Comando DeleteActivityCommand
 * Descripción: Datos para desactivar (borrado lógico) una actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteActivityCommand {
  public readonly activityId: string;
  public readonly performedBy: string;
  public readonly requesterRole: string;

  public constructor({ activityId, performedBy, requesterRole }: { activityId: string; performedBy: string; requesterRole: string }) {
    this.activityId = activityId;
    this.performedBy = performedBy;
    this.requesterRole = requesterRole;
  }
}
