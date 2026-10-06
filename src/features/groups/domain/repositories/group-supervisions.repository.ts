/*
 * Funcionalidad: Repositorio de supervisiones de grupo
 * Descripción: Contrato de persistencia y lectura de los vínculos de supervisión entre un grupo TEACHER y un grupo STUDENT (existencia, alta, baja y vista de los grupos supervisados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupSupervisionView } from "@/features/groups/domain/read-models/group.read-model";

export const GROUP_SUPERVISIONS_REPOSITORY_TOKEN: unique symbol = Symbol("GROUP_SUPERVISIONS_REPOSITORY_TOKEN");

export interface IGroupSupervisionsRepository {
  exists(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<boolean>;
  add(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<void>;
  remove(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<void>;
  getViews(teacherGroupId: string): Promise<GroupSupervisionView[]>;
}
