/*
 * Funcionalidad: Comando UpdateActivityCommand
 * Descripción: Datos para editar una actividad (cambios parciales, autor y rol del solicitante)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityChanges } from "@/features/activities/domain/entities/activity.entity";

export class UpdateActivityCommand {
  public readonly activityId: string;
  public readonly changes: ActivityChanges;
  public readonly performedBy: string;
  public readonly requesterRole: string;

  public constructor({
    activityId,
    changes,
    performedBy,
    requesterRole,
  }: {
    activityId: string;
    changes: ActivityChanges;
    performedBy: string;
    requesterRole: string;
  }) {
    this.activityId = activityId;
    this.changes = changes;
    this.performedBy = performedBy;
    this.requesterRole = requesterRole;
  }
}
