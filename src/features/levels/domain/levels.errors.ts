/*
 * Funcionalidad: Errores de dominio de niveles
 * Descripción: Define los errores LevelNotFoundError, PrerequisiteLevelNotFoundError, ParentLevelNotFoundError, LevelTitleAlreadyExistsError, LevelOrderAlreadyTakenError, InvalidLevelReorderError y otros que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class LevelNotFoundError extends DomainError {
  public constructor() {
    super("Level not found", "levels.level_not_found");
  }
}

export class PrerequisiteLevelNotFoundError extends DomainError {
  public constructor() {
    super("Prerequisite level not found", "levels.prerequisite_level_not_found");
  }
}

export class ParentLevelNotFoundError extends DomainError {
  public constructor() {
    super("Parent level not found", "levels.parent_level_not_found");
  }
}

export class LevelTitleAlreadyExistsError extends DomainError {
  public constructor() {
    super("A level with this title already exists", "levels.level_title_already_exists");
  }
}

export class LevelOrderAlreadyTakenError extends DomainError {
  public constructor(order: number) {
    super(`Another level already has order ${order}`, "levels.level_order_already_taken");
  }
}

export class InvalidLevelReorderError extends DomainError {
  public constructor() {
    super("One or more levels do not exist", "levels.invalid_level_reorder");
  }
}

export class LevelSelfPrerequisiteError extends DomainError {
  public constructor() {
    super("A level cannot be its own prerequisite", "levels.level_self_prerequisite");
  }
}

export class LevelCircularDependencyError extends DomainError {
  public constructor() {
    super("Adding this prerequisite would create a circular dependency", "levels.level_circular_dependency");
  }
}

export class LevelPrerequisiteAlreadyExistsError extends DomainError {
  public constructor() {
    super("The level already has this prerequisite", "levels.level_prerequisite_already_exists");
  }
}

export class LevelPrerequisiteNotFoundError extends DomainError {
  public constructor() {
    super("The level does not have this prerequisite", "levels.level_prerequisite_not_found");
  }
}
