/*
 * Funcionalidad: Caso de uso GetMilestonesUseCase
 * Descripción: Devuelve el resumen de hitos de gamificación del progreso desde el catálogo estático de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type MilestonesSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import { MILESTONES_SUMMARY } from "@/features/progress/domain/services/progress-catalog";

@Injectable()
export class GetMilestonesUseCase {
  public execute(): MilestonesSummary {
    return MILESTONES_SUMMARY;
  }
}
