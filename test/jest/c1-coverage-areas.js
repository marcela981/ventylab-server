/*
 * Funcionalidad: Alcance de la cobertura unitaria C1
 * Descripción: Lista, por área de reglas de negocio, las carpetas de src cuya cobertura de líneas exige la suite unitaria (al menos 80 % por carpeta); la usan jest.unit.config.js y el resumen por área de scripts/verify/print-c1-coverage.mjs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const C1_AREAS = {
  progress: ["features/progress/application", "features/progress/domain/services"],
  "evaluation grading": ["features/evaluation/application/use-cases", "features/evaluation/domain/services"],
  "simulation scoring and engine": ["features/simulation/domain/scoring", "features/simulation/domain/engine"],
  "reservations and preemption": ["features/reservations/application", "features/reservations/domain/services"],
  "AI orchestrator and gateway": ["features/ai/application/services", "features/ai/domain/services"],
  "platform settings hard limits": ["features/platform-settings/application", "features/platform-settings/domain"],
};

module.exports = { C1_AREAS };
