/*
 * Funcionalidad: Comando ChangeUserStatusCommand
 * Descripción: Datos de entrada para activar o desactivar la cuenta de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ChangeUserStatusCommand {
  public readonly userId: string;
  public readonly isActive: boolean;
  public readonly performedBy: string;

  public constructor({ userId, isActive, performedBy }: { userId: string; isActive: boolean; performedBy: string }) {
    this.userId = userId;
    this.isActive = isActive;
    this.performedBy = performedBy;
  }
}
