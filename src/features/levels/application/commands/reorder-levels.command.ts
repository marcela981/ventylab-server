/*
 * Funcionalidad: Comando ReorderLevelsCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ReorderLevelsCommand {
  public readonly levelIds: string[];
  public readonly performedBy: string;

  public constructor({
    levelIds,
    performedBy,
  }: {
    levelIds: string[];
    performedBy: string;
  }) {
    this.levelIds = levelIds;
    this.performedBy = performedBy;
  }
}
