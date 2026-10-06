/*
 * Funcionalidad: Comando DeleteOverrideCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteOverrideCommand {
  public readonly overrideId: string;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({
    overrideId,
    requesterId,
    requesterRole,
  }: {
    overrideId: string;
    requesterId: string;
    requesterRole: string;
  }) {
    this.overrideId = overrideId;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
