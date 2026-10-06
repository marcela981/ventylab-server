/*
 * Funcionalidad: Comando DeleteLevelCommand
 * Descripción: Transporta el nivel que se elimina físicamente junto con su subárbol y el usuario que realiza la acción
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteLevelCommand {
  public readonly levelId: string;
  public readonly performedBy: string;

  public constructor({ levelId, performedBy }: { levelId: string; performedBy: string }) {
    this.levelId = levelId;
    this.performedBy = performedBy;
  }
}
