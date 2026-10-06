/*
 * Funcionalidad: Comando AddGroupMemberCommand
 * Descripción: Datos para agregar un usuario a un grupo; el rol heredado de la membresía se deriva del rol del usuario y el rol del ejecutor define su alcance de gestión
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class AddGroupMemberCommand {
  public readonly groupId: string;
  public readonly userId: string;
  public readonly performedBy: string;
  public readonly performedByRole: string;

  public constructor({
    groupId,
    userId,
    performedBy,
    performedByRole,
  }: {
    groupId: string;
    userId: string;
    performedBy: string;
    performedByRole: string;
  }) {
    this.groupId = groupId;
    this.userId = userId;
    this.performedBy = performedBy;
    this.performedByRole = performedByRole;
  }
}
