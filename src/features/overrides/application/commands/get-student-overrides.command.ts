/*
 * Funcionalidad: Comando GetStudentOverridesCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";

export class GetStudentOverridesCommand {
  public readonly studentId: string;
  public readonly entityType?: OverrideEntityTypeValue;
  public readonly includeInactive: boolean;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({
    studentId,
    entityType,
    includeInactive,
    requesterId,
    requesterRole,
  }: {
    studentId: string;
    entityType?: OverrideEntityTypeValue;
    includeInactive: boolean;
    requesterId: string;
    requesterRole: string;
  }) {
    this.studentId = studentId;
    this.entityType = entityType;
    this.includeInactive = includeInactive;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
