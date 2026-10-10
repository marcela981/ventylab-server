/*
 * Funcionalidad: Comando ChangeClinicalCaseStatusCommand
 * Descripción: Intención de cambiar el estado (DRAFT, PUBLISHED, ARCHIVED) de un caso clínico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";

export class ChangeClinicalCaseStatusCommand {
  public readonly caseId: string;
  public readonly status: ClinicalCaseStatusValue;
  public readonly performedBy: string;

  public constructor({ caseId, status, performedBy }: { caseId: string; status: ClinicalCaseStatusValue; performedBy: string }) {
    this.caseId = caseId;
    this.status = status;
    this.performedBy = performedBy;
  }
}
