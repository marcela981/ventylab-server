/*
 * Funcionalidad: Puerto de repositorio CURRICULUM_SUBTREE_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ICurriculumSubtreeRepository para recolectar el subárbol de un nodo curricular, contar sus datos de estudiantes y eliminarlo de hijos a padres dentro de una transacción
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumNodeKind, type CurriculumSubtree } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { type StudentDataCounts } from "@/features/curriculum/domain/services/delete-guard";

export const CURRICULUM_SUBTREE_REPOSITORY_TOKEN: unique symbol = Symbol("CURRICULUM_SUBTREE_REPOSITORY_TOKEN");

export interface ICurriculumSubtreeRepository {
  collect(kind: CurriculumNodeKind, id: string, transaction?: unknown): Promise<CurriculumSubtree | undefined>;
  countStudentData(subtree: CurriculumSubtree, transaction?: unknown): Promise<StudentDataCounts>;
  deleteSubtree(subtree: CurriculumSubtree, transaction?: unknown): Promise<void>;
}
