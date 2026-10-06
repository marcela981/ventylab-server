/*
 * Funcionalidad: Catálogo estático de hitos y habilidades
 * Descripción: Define el resumen de hitos (sin hitos configurados) y las categorías de habilidades con su nivel general, que devuelven las rutas de gamificación del progreso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MilestonesSummary, type SkillsSummary } from "@/features/progress/domain/read-models/progress-views.read-model";

export const DEFAULT_OVERALL_SKILL_LEVEL: string = "beginner";

export const MILESTONES_SUMMARY: MilestonesSummary = {
  milestones: [],
  totalCompleted: 0,
  totalAvailable: 0,
};

export const SKILLS_SUMMARY: SkillsSummary = {
  skills: [],
  categories: [
    { id: "physiology", name: "Fisiología Respiratoria", progress: 0 },
    { id: "ventilation", name: "Ventilación Mecánica", progress: 0 },
  ],
  overallLevel: DEFAULT_OVERALL_SKILL_LEVEL,
};
