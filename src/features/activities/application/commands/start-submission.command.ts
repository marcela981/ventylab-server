/*
 * Funcionalidad: Comando StartSubmissionCommand
 * Descripción: Datos para iniciar u obtener la entrega en borrador de un estudiante para una actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class StartSubmissionCommand {
  public readonly activityId: string;
  public readonly userId: string;
  public readonly requesterRole: string;

  public constructor({ activityId, userId, requesterRole }: { activityId: string; userId: string; requesterRole: string }) {
    this.activityId = activityId;
    this.userId = userId;
    this.requesterRole = requesterRole;
  }
}
