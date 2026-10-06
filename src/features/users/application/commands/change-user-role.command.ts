/*
 * Funcionalidad: Comando ChangeUserRoleCommand
 * Descripción: Datos de entrada para cambiar el rol de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ChangeUserRoleCommand {
  public readonly userId: string;
  public readonly role: string;
  public readonly performedBy: string;

  public constructor({ userId, role, performedBy }: { userId: string; role: string; performedBy: string }) {
    this.userId = userId;
    this.role = role;
    this.performedBy = performedBy;
  }
}
