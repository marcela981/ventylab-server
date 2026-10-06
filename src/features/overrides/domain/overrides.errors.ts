/*
 * Funcionalidad: Errores de dominio de personalizaciones de contenido por estudiante
 * Descripción: Define los errores ContentOverrideNotFoundError, CannotManageOverridesError, OverrideTargetNotFoundError, InvalidOverrideDataError, ContentOverrideAlreadyExistsError que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class ContentOverrideNotFoundError extends DomainError {
  public constructor() {
    super("Content override not found", "overrides.content_override_not_found");
  }
}

export class CannotManageOverridesError extends DomainError {
  public constructor() {
    super("You are not allowed to manage overrides for this student", "overrides.cannot_manage_overrides");
  }
}

export class OverrideTargetNotFoundError extends DomainError {
  public constructor(entityType: string, entityId: string) {
    super(`${entityType} entity not found with ID ${entityId}`, "overrides.override_target_not_found");
  }
}

export class InvalidOverrideDataError extends DomainError {
  public constructor(reason: string) {
    super(`Invalid override data: ${reason}`, "overrides.invalid_override_data");
  }
}

export class ContentOverrideAlreadyExistsError extends DomainError {
  public constructor() {
    super("An override already exists for this student and entity", "overrides.content_override_already_exists");
  }
}
