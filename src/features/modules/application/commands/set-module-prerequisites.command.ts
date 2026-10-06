/*
 * Funcionalidad: Comando SetModulePrerequisitesCommand
 * Descripción: Transporta el módulo y la lista completa de módulos prerrequisito que reemplaza a la actual
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SetModulePrerequisitesCommand {
  public readonly moduleId: string;
  public readonly prerequisiteIds: string[];
  public readonly performedBy?: string;

  public constructor({ moduleId, prerequisiteIds, performedBy }: { moduleId: string; prerequisiteIds: string[]; performedBy?: string }) {
    this.moduleId = moduleId;
    this.prerequisiteIds = prerequisiteIds;
    this.performedBy = performedBy;
  }
}
