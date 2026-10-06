/*
 * Funcionalidad: Puerto de repositorio SECTION_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ISectionQueriesRepository para listar secciones y los niveles de una sección según la visibilidad del lector
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SectionLevelItem, type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";

export const SECTION_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("SECTION_QUERIES_REPOSITORY_TOKEN");

export interface ISectionQueriesRepository {
  getSummaries(canManage: boolean): Promise<SectionSummary[]>;
  getSummary(sectionId: string, canManage: boolean): Promise<SectionSummary | undefined>;
  getLevels(sectionId: string, canManage: boolean): Promise<SectionLevelItem[]>;
}
