/*
 * Funcionalidad: Modelos de lectura de grupos
 * Descripción: Vistas de solo lectura de grupos (líder, creador, grupo padre, subgrupos activos y conteos), de miembros con sus datos de usuario, del grupo propio del estudiante, de las membresías de un usuario y de las supervisiones, y filtros del listado de grupos (incluido el alcance del profesor)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { type GroupMembershipRoleValue } from "@/features/groups/domain/value-objects/group-membership-role";
import { type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

export interface GroupPersonView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface GroupReferenceView {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
}

export interface SubgroupView {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
  readonly membersCount: number;
  readonly subGroupsCount: number;
}

export interface GroupMemberUserView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: string;
  readonly image?: string;
  readonly createdAt?: Date;
}

export interface GroupMemberView {
  readonly member: GroupMember;
  readonly user: GroupMemberUserView;
}

export interface GroupView {
  readonly group: Group;
  readonly leader?: GroupPersonView;
  readonly creator?: GroupPersonView;
  readonly parentGroup?: GroupReferenceView;
  readonly subGroups: SubgroupView[];
  readonly membersCount: number;
  readonly subGroupsCount: number;
}

export interface GroupDetailView extends GroupView {
  readonly members: GroupMemberView[];
}

export interface GetGroupsFilter {
  teacherId?: string;
  studentId?: string;
  parentGroupId?: string | null;
  depth?: number;
  isActive?: boolean;
  type?: GroupTypeValue;
  managedByTeacherId?: string;
}

export interface GroupMembershipSummaryView {
  readonly groupId: string;
  readonly groupName: string;
  readonly groupType: GroupTypeValue;
  readonly isActive: boolean;
  readonly memberRole: GroupMembershipRoleValue;
}

export interface StudentGroupMemberSummaryView {
  readonly userId: string;
  readonly name?: string;
  readonly memberRole: GroupMembershipRoleValue;
}

export interface GroupNameView {
  readonly id: string;
  readonly name: string;
}

export interface StudentGroupSummaryView {
  readonly id: string;
  readonly name: string;
  readonly leader?: { readonly id: string; readonly name?: string };
  readonly members: StudentGroupMemberSummaryView[];
  readonly supervisingGroups: GroupNameView[];
}

export interface GroupSupervisionView {
  readonly teacherGroupId: string;
  readonly studentGroup: GroupNameView & { readonly isActive: boolean };
  readonly createdAt: Date;
}
