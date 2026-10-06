/*
 * Funcionalidad: Modelos de lectura de secciones
 * Descripción: Define SectionSummary y SectionLevelItem, que devuelven las consultas de la feature de secciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface SectionSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly levelCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SectionLevelItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly track: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly moduleCount: number;
}
