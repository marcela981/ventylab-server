/*
 * Funcionalidad: Comando LevelPrerequisiteCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class LevelPrerequisiteCommand {
  public readonly levelId: string;
  public readonly prerequisiteLevelId: string;
  public readonly performedBy: string;

  public constructor({
    levelId,
    prerequisiteLevelId,
    performedBy,
  }: {
    levelId: string;
    prerequisiteLevelId: string;
    performedBy: string;
  }) {
    this.levelId = levelId;
    this.prerequisiteLevelId = prerequisiteLevelId;
    this.performedBy = performedBy;
  }
}
