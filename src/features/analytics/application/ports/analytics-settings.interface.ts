/*
 * Funcionalidad: Puerto de ajustes de analítica
 * Descripción: Contrato y token de los ajustes que lee la analítica en cada petición: nota aprobatoria vigente y umbrales de riesgo del panel docente (máximo de evaluaciones reprobadas, progreso mínimo y días de inactividad); la raíz de composición lo enlaza a los ajustes de la plataforma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentRiskThresholds } from "@/features/analytics/domain/services/student-risk";

export const ANALYTICS_SETTINGS_TOKEN: unique symbol = Symbol("ANALYTICS_SETTINGS_TOKEN");

export interface AnalyticsSettings {
  readonly passingGrade: number;
  readonly riskThresholds: StudentRiskThresholds;
}
