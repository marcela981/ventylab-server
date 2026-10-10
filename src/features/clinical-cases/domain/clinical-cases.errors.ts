/*
 * Funcionalidad: Errores de la feature de casos clínicos
 * Descripción: Errores de dominio de casos clínicos (no encontrado, no disponible, sin configuración experta, valor fisiológicamente implausible, definición inválida, caso en uso, caso con sesiones de simulación y caso no listo para simular) con sus claves i18n
 * Versión: 1.1
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

export class ClinicalCasePhysiologicalRangeError extends DomainError {
  public constructor(
    public readonly field: string,
    public readonly value: number,
    public readonly min: number,
    public readonly max: number,
    public readonly unit: string,
  ) {
    super(`${field} must be between ${min} and ${max} ${unit}`, "clinical-cases.physiological_range_violation");
  }

  public get i18nArgs(): Record<string, string | number> {
    return { field: this.field, value: this.value, min: this.min, max: this.max, unit: this.unit };
  }
}

export class InvalidClinicalCaseDefinitionError extends DomainError {
  public constructor(public readonly field: string) {
    super(`Invalid clinical case definition at ${field}`, "clinical-cases.invalid_definition");
  }

  public get i18nArgs(): Record<string, string> {
    return { field: this.field };
  }
}

export class ClinicalCaseInUseError extends DomainError {
  public constructor() {
    super("Clinical case is in use; archive it instead of deleting it", "clinical-cases.clinical_case_in_use");
  }
}

export class ClinicalCaseHasSimulationSessionsError extends DomainError {
  public constructor() {
    super("Clinical case has simulation sessions; duplicate it to change its definition", "clinical-cases.clinical_case_has_simulation_sessions");
  }
}

export class ClinicalCaseNotSimulationReadyError extends DomainError {
  public constructor() {
    super("Clinical case is not ready for simulation", "clinical-cases.clinical_case_not_simulation_ready");
  }
}
