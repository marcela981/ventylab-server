/*
 * Funcionalidad: Comando ModulePrerequisiteCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ModulePrerequisiteCommand {
  public readonly moduleId: string;
  public readonly prerequisiteId: string;
  public readonly performedBy: string;

  public constructor({
    moduleId,
    prerequisiteId,
    performedBy,
  }: {
    moduleId: string;
    prerequisiteId: string;
    performedBy: string;
  }) {
    this.moduleId = moduleId;
    this.prerequisiteId = prerequisiteId;
    this.performedBy = performedBy;
  }
}
