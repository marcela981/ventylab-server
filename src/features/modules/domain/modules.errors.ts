/*
 * Funcionalidad: Errores de dominio de módulos
 * Descripción: Define los errores ModuleNotFoundError, PrerequisiteModuleNotFoundError, ModuleTitleAlreadyExistsError, ModuleOrderAlreadyTakenError, InvalidModulePrerequisitesError, InvalidModuleReorderError y otros que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class ModuleNotFoundError extends DomainError {
  public constructor() {
    super("Module not found", "modules.module_not_found");
  }
}

export class PrerequisiteModuleNotFoundError extends DomainError {
  public constructor() {
    super("Prerequisite module not found", "modules.prerequisite_module_not_found");
  }
}

export class ModuleTitleAlreadyExistsError extends DomainError {
  public constructor() {
    super("A module with this title already exists", "modules.module_title_already_exists");
  }
}

export class ModuleOrderAlreadyTakenError extends DomainError {
  public constructor(order: number) {
    super(`Another module already has order ${order}`, "modules.module_order_already_taken");
  }
}

export class InvalidModulePrerequisitesError extends DomainError {
  public constructor() {
    super("One or more prerequisite modules do not exist", "modules.invalid_module_prerequisites");
  }
}

export class InvalidModuleReorderError extends DomainError {
  public constructor() {
    super("The module list must contain every module of the level exactly once", "modules.invalid_module_reorder");
  }
}

export class ModuleSelfPrerequisiteError extends DomainError {
  public constructor() {
    super("A module cannot be its own prerequisite", "modules.module_self_prerequisite");
  }
}

export class ModuleCircularDependencyError extends DomainError {
  public constructor() {
    super("Adding this prerequisite would create a circular dependency", "modules.module_circular_dependency");
  }
}

export class ModulePrerequisiteAlreadyExistsError extends DomainError {
  public constructor() {
    super("The module already has this prerequisite", "modules.module_prerequisite_already_exists");
  }
}

export class ModulePrerequisiteNotFoundError extends DomainError {
  public constructor() {
    super("The module does not have this prerequisite", "modules.module_prerequisite_not_found");
  }
}

export class ModuleInactiveError extends DomainError {
  public constructor() {
    super("The module is not active", "modules.module_inactive");
  }
}

export class ModuleHasNoLessonsError extends DomainError {
  public constructor() {
    super("The module has no active lessons", "modules.module_has_no_lessons");
  }
}

export class ModuleNodeLevelRequiredError extends DomainError {
  public constructor() {
    super("A level is required to create a module", "modules.module_node_level_required");
  }
}
