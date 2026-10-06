/*
 * Funcionalidad: Puerto de repositorio OVERRIDES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IContentOverrideRepository y su token de inyección para la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentOverride } from "@/features/overrides/domain/entities/content-override.entity";
import { type ContentOverrideView } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";

export const OVERRIDES_REPOSITORY_TOKEN: unique symbol = Symbol("OVERRIDES_REPOSITORY_TOKEN");

export interface GetStudentOverridesQuery {
  studentId: string;
  entityType?: OverrideEntityTypeValue;
  includeInactive: boolean;
}

export interface IContentOverrideRepository {
  getById(id: string, transaction?: unknown): Promise<ContentOverride | undefined>;
  existsForTarget(studentId: string, entityType: OverrideEntityTypeValue, entityId: string, transaction?: unknown): Promise<boolean>;
  getView(id: string): Promise<ContentOverrideView | undefined>;
  getViewsForStudent(query: GetStudentOverridesQuery): Promise<ContentOverrideView[]>;
  save(override: ContentOverride, transaction?: unknown): Promise<void>;
}
