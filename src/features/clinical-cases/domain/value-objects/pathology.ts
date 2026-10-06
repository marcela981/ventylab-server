/*
 * Funcionalidad: Valores de patología de caso clínico
 * Descripción: Constantes del enum Pathology usadas para filtrar casos clínicos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type PathologyValue =
  | "EPOC"
  | "SDRA"
  | "NEUMONIA"
  | "ASMA"
  | "FIBROSIS_PULMONAR"
  | "EDEMA_PULMONAR"
  | "EMBOLIA_PULMONAR"
  | "TEP"
  | "BRONQUIOLITIS"
  | "SINDROME_DE_DISTRES_RESPIRATORIO"
  | "OTRAS";

export const PATHOLOGY_VALUES: readonly PathologyValue[] = [
  "EPOC",
  "SDRA",
  "NEUMONIA",
  "ASMA",
  "FIBROSIS_PULMONAR",
  "EDEMA_PULMONAR",
  "EMBOLIA_PULMONAR",
  "TEP",
  "BRONQUIOLITIS",
  "SINDROME_DE_DISTRES_RESPIRATORIO",
  "OTRAS",
] as const;
