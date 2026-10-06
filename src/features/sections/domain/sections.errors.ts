/*
 * Funcionalidad: Errores de dominio de secciones
 * Descripción: Define SectionNotFoundError, SectionSlugAlreadyExistsError e InvalidSectionReorderError, que el filtro HTTP traduce mediante errors-map e i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class SectionNotFoundError extends DomainError {
  public constructor() {
    super("Section not found", "sections.section_not_found");
  }
}

export class SectionSlugAlreadyExistsError extends DomainError {
  public constructor() {
    super("A section with this slug already exists", "sections.section_slug_already_exists");
  }
}

export class InvalidSectionReorderError extends DomainError {
  public constructor() {
    super("The section list is empty, has duplicates or contains unknown sections", "sections.invalid_section_reorder");
  }
}
