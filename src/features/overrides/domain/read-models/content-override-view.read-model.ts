/*
 * Funcionalidad: Modelos de lectura de personalizaciones de contenido por estudiante
 * Descripción: Define las interfaces OverrideUserSummary, ContentOverrideView que devuelven las consultas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OverrideData } from "@/features/overrides/domain/value-objects/override-data";

export interface OverrideUserSummary {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface ContentOverrideView {
  readonly id: string;
  readonly studentId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly overrideData: OverrideData;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isActive: boolean;
  readonly student?: OverrideUserSummary;
  readonly creator?: OverrideUserSummary;
}
