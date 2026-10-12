/*
 * Funcionalidad: Errores de dominio de notificaciones
 * Descripción: Error de notificación inexistente o ajena al usuario (se responde igual para no revelar notificaciones de otros)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class NotificationNotFoundError extends DomainError {
  public constructor() {
    super("Notification not found", "notifications.not_found");
  }
}
