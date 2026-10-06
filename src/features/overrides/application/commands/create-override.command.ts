/*
 * Funcionalidad: Comando CreateOverrideCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OverrideData } from "@/features/overrides/domain/value-objects/override-data";
import { type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";

export class CreateOverrideCommand {
  public readonly studentId: string;
  public readonly entityType: OverrideEntityTypeValue;
  public readonly entityId: string;
  public readonly overrideData: OverrideData;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({
    studentId,
    entityType,
    entityId,
    overrideData,
    requesterId,
    requesterRole,
  }: {
    studentId: string;
    entityType: OverrideEntityTypeValue;
    entityId: string;
    overrideData: OverrideData;
    requesterId: string;
    requesterRole: string;
  }) {
    this.studentId = studentId;
    this.entityType = entityType;
    this.entityId = entityId;
    this.overrideData = overrideData;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
