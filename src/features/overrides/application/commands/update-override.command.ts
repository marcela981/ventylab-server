/*
 * Funcionalidad: Comando UpdateOverrideCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OverrideData } from "@/features/overrides/domain/value-objects/override-data";

export class UpdateOverrideCommand {
  public readonly overrideId: string;
  public readonly overrideData?: OverrideData;
  public readonly isActive?: boolean;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({
    overrideId,
    overrideData,
    isActive,
    requesterId,
    requesterRole,
  }: {
    overrideId: string;
    overrideData?: OverrideData;
    isActive?: boolean;
    requesterId: string;
    requesterRole: string;
  }) {
    this.overrideId = overrideId;
    this.overrideData = overrideData;
    this.isActive = isActive;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
