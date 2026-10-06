/*
 * Funcionalidad: Comando ChangePasswordCommand
 * Descripción: Datos de entrada para cambiar la contraseña del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ChangePasswordCommand {
  public readonly userId: string;
  public readonly currentPassword: string;
  public readonly newPassword: string;
  public readonly performedBy: string;

  public constructor({
    userId,
    currentPassword,
    newPassword,
    performedBy,
  }: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    performedBy: string;
  }) {
    this.userId = userId;
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
    this.performedBy = performedBy;
  }
}
