/*
 * Funcionalidad: Repositorio de grupos
 * Descripción: Contrato de persistencia y lectura del agregado Group (búsqueda, unicidad del código de inscripción, conteo de subgrupos, vistas del listado y detalle), de las lecturas de pertenencia que consumen otras features (grupos de un usuario y grupo activo), del alcance de supervisión del profesor, del historial que impide el borrado físico y de las vistas del grupo propio y las membresías de un usuario
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Group } from "@/features/groups/domain/entities/group.entity";
import {
  type GetGroupsFilter,
  type GroupDetailView,
  type GroupMembershipSummaryView,
  type GroupView,
  type StudentGroupSummaryView,
} from "@/features/groups/domain/read-models/group.read-model";

export const GROUPS_REPOSITORY_TOKEN: unique symbol = Symbol("GROUPS_REPOSITORY_TOKEN");

export interface IGroupsRepository {
  getById(id: string, transaction?: unknown): Promise<Group | undefined>;
  existsByEnrollmentCode(enrollmentCode: string, transaction?: unknown): Promise<boolean>;
  countSubgroups(groupId: string, transaction?: unknown): Promise<number>;
  getViews(filter: GetGroupsFilter): Promise<GroupView[]>;
  getDetailView(id: string): Promise<GroupDetailView | undefined>;
  getGroupIdsForUser(userId: string, transaction?: unknown): Promise<string[]>;
  isActiveGroup(groupId: string, transaction?: unknown): Promise<boolean>;
  isSupervisedByTeacherMember(studentGroupId: string, teacherUserId: string, transaction?: unknown): Promise<boolean>;
  getSupervisedStudentGroupIds(teacherUserId: string, transaction?: unknown): Promise<string[]>;
  hasActivityHistory(groupId: string, transaction?: unknown): Promise<boolean>;
  getStudentGroupSummaryOfUser(userId: string): Promise<StudentGroupSummaryView | undefined>;
  getMembershipSummariesOfUser(userId: string): Promise<GroupMembershipSummaryView[]>;
  save(group: Group, transaction?: unknown): Promise<void>;
  delete(group: Group, transaction?: unknown): Promise<void>;
}
