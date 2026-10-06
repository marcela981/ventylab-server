/*
 * Funcionalidad: Caso de uso GetSkillsUseCase
 * Descripción: Devuelve el resumen de habilidades y categorías de competencia del progreso desde el catálogo estático de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type SkillsSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import { SKILLS_SUMMARY } from "@/features/progress/domain/services/progress-catalog";

@Injectable()
export class GetSkillsUseCase {
  public execute(): SkillsSummary {
    return SKILLS_SUMMARY;
  }
}
