/*
 * Funcionalidad: Comando AssignActivityCommand
 * Descripción: Datos para asignar (o actualizar la asignación de) una actividad a un grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class AssignActivityCommand {
  public readonly activityId: string;
  public readonly groupId: string;
  public readonly visibleFrom?: Date | null;
  public readonly dueDate?: Date | null;
  public readonly isActive?: boolean;
  public readonly performedBy: string;
  public readonly requesterRole: string;

  public constructor({
    activityId,
    groupId,
    visibleFrom,
    dueDate,
    isActive,
    performedBy,
    requesterRole,
  }: {
    activityId: string;
    groupId: string;
    visibleFrom?: Date | null;
    dueDate?: Date | null;
    isActive?: boolean;
    performedBy: string;
    requesterRole: string;
  }) {
    this.activityId = activityId;
    this.groupId = groupId;
    this.visibleFrom = visibleFrom;
    this.dueDate = dueDate;
    this.isActive = isActive;
    this.performedBy = performedBy;
    this.requesterRole = requesterRole;
  }
}
