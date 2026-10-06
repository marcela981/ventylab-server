/*
 * Funcionalidad: Tipos de bloque de página
 * Descripción: Enumera los tipos de bloque de contenido (los semánticos heredados del JSON de lecciones y los de formato del editor) y los agrupa en texto enriquecido, bloques con media obligatoria, video, ecuación, código y separador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type PageBlockTypeValue =
  | "INTRODUCTION"
  | "THEORY"
  | "CASE_STUDY"
  | "SUMMARY"
  | "EXERCISE"
  | "QUIZ"
  | "REFERENCES"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "EQUATION"
  | "CALLOUT"
  | "CODE"
  | "DIVIDER"
  | "FILE";

export const PAGE_BLOCK_TYPE_VALUES: readonly PageBlockTypeValue[] = [
  "INTRODUCTION",
  "THEORY",
  "CASE_STUDY",
  "SUMMARY",
  "EXERCISE",
  "QUIZ",
  "REFERENCES",
  "TEXT",
  "IMAGE",
  "VIDEO",
  "EQUATION",
  "CALLOUT",
  "CODE",
  "DIVIDER",
  "FILE",
] as const;

export const RICH_TEXT_BLOCK_TYPES: readonly PageBlockTypeValue[] = [
  "INTRODUCTION",
  "THEORY",
  "CASE_STUDY",
  "SUMMARY",
  "EXERCISE",
  "QUIZ",
  "REFERENCES",
  "TEXT",
  "CALLOUT",
] as const;

export const MEDIA_REQUIRED_BLOCK_TYPES: readonly PageBlockTypeValue[] = ["IMAGE", "FILE"] as const;

export const VIDEO_BLOCK_TYPE: PageBlockTypeValue = "VIDEO";
export const EQUATION_BLOCK_TYPE: PageBlockTypeValue = "EQUATION";
export const CODE_BLOCK_TYPE: PageBlockTypeValue = "CODE";
export const DIVIDER_BLOCK_TYPE: PageBlockTypeValue = "DIVIDER";

export function isPageBlockType(value: string): value is PageBlockTypeValue {
  return (PAGE_BLOCK_TYPE_VALUES as readonly string[]).includes(value);
}
