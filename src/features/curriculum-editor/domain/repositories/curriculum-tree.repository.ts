/*
 * Funcionalidad: Puerto de repositorio CURRICULUM_TREE_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ICurriculumTreeRepository y su token de inyección para la feature de editor del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumTreeLevel } from "@/features/curriculum-editor/domain/read-models/curriculum-tree.read-model";

export const CURRICULUM_TREE_REPOSITORY_TOKEN: unique symbol = Symbol("CURRICULUM_TREE_REPOSITORY_TOKEN");

export interface ICurriculumTreeRepository {
  getLevelsWithContent(track?: string): Promise<CurriculumTreeLevel[]>;
}
