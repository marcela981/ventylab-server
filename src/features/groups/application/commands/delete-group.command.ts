/*
 * Funcionalidad: Comando DeleteGroupCommand
 * Descripción: Datos para eliminar o desactivar un grupo sin subgrupos, con el ejecutor y su rol
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteGroupCommand {
  public readonly groupId: string;
  public readonly performedBy: string;
  public readonly performedByRole: string;

  public constructor({
    groupId,
    performedBy,
    performedByRole,
  }: {
    groupId: string;
    performedBy: string;
    performedByRole: string;
  }) {
    this.groupId = groupId;
    this.performedBy = performedBy;
    this.performedByRole = performedByRole;
  }
}
