/*
 * Funcionalidad: Errores de dominio de páginas
 * Descripción: Define PageNotFoundError, PageSlugAlreadyExistsError, InvalidPageBlockError, PageBlockNotFoundError, PageMediaNotFoundError, InvalidPageReorderError e InvalidPageBlockReorderError, que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class PageNotFoundError extends DomainError {
  public constructor() {
    super("Page not found", "pages.page_not_found");
  }
}

export class PageSlugAlreadyExistsError extends DomainError {
  public constructor() {
    super("Another page of the module already has this slug", "pages.page_slug_already_exists");
  }
}

export class InvalidPageBlockError extends DomainError {
  public constructor(reason: string) {
    super(`Invalid page block: ${reason}`, "pages.invalid_page_block");
  }
}

export class PageBlockNotFoundError extends DomainError {
  public constructor() {
    super("Page block not found", "pages.page_block_not_found");
  }
}

export class PageMediaNotFoundError extends DomainError {
  public constructor() {
    super("The referenced media does not exist", "pages.page_media_not_found");
  }
}

export class InvalidPageReorderError extends DomainError {
  public constructor() {
    super("The page list must contain every page of the lesson exactly once", "pages.invalid_page_reorder");
  }
}

export class InvalidPageBlockReorderError extends DomainError {
  public constructor() {
    super("The block list must contain every block of the page exactly once", "pages.invalid_page_block_reorder");
  }
}
