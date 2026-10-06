/*
 * Funcionalidad: Comando SetSimulatorLeadCommand
 * Descripción: Datos para asignar o limpiar (userId ausente) el líder de un grupo STUDENT, con el ejecutor y su rol
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SetSimulatorLeadCommand {
  public readonly groupId: string;
  public readonly userId?: string;
  public readonly performedBy: string;
  public readonly performedByRole: string;

  public constructor({
    groupId,
    userId,
    performedBy,
    performedByRole,
  }: {
    groupId: string;
    userId?: string;
    performedBy: string;
    performedByRole: string;
  }) {
    this.groupId = groupId;
    this.userId = userId;
    this.performedBy = performedBy;
    this.performedByRole = performedByRole;
  }
}
