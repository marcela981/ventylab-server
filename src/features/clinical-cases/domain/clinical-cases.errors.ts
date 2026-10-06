/*
 * Funcionalidad: Errores de la feature de casos clínicos
 * Descripción: Errores de dominio de casos clínicos (no encontrado, no disponible, sin configuración experta) con sus claves i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class ClinicalCaseNotFoundError extends DomainError {
  public constructor() {
    super("Clinical case not found", "clinical-cases.clinical_case_not_found");
  }
}

export class ClinicalCaseUnavailableError extends DomainError {
  public constructor() {
    super("Clinical case is not available", "clinical-cases.clinical_case_unavailable");
  }
}

export class ExpertConfigurationMissingError extends DomainError {
  public constructor() {
    super("Clinical case has no expert configuration", "clinical-cases.expert_configuration_missing");
  }
}
