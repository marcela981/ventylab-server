/*
 * Funcionalidad: Comando SetLevelPrerequisitesCommand
 * Descripción: Transporta el nivel y la lista completa de niveles prerrequisito que reemplaza a la actual
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SetLevelPrerequisitesCommand {
  public readonly levelId: string;
  public readonly prerequisiteLevelIds: string[];
  public readonly performedBy?: string;

  public constructor({ levelId, prerequisiteLevelIds, performedBy }: { levelId: string; prerequisiteLevelIds: string[]; performedBy?: string }) {
    this.levelId = levelId;
    this.prerequisiteLevelIds = prerequisiteLevelIds;
    this.performedBy = performedBy;
  }
}
