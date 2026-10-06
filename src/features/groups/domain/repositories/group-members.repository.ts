/*
 * Funcionalidad: Repositorio de miembros de grupo
 * Descripción: Contrato de persistencia y lectura del agregado GroupMember (búsqueda por grupo y usuario, líderes del grupo, conteo por rol, usuarios STUDENT miembros del grupo, membresías del estudiante en otros grupos STUDENT activos, vistas de miembros con datos de usuario y eliminación) y del bloqueo transaccional por clave
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type GroupMemberView } from "@/features/groups/domain/read-models/group.read-model";
import { type GroupMemberRoleValue } from "@/features/groups/domain/value-objects/group-member-role";

export const GROUP_MEMBERS_REPOSITORY_TOKEN: unique symbol = Symbol("GROUP_MEMBERS_REPOSITORY_TOKEN");

export interface IGroupMembersRepository {
  getByGroupAndUser(groupId: string, userId: string, transaction?: unknown): Promise<GroupMember | undefined>;
  getLeaders(groupId: string, transaction?: unknown): Promise<GroupMember[]>;
  countByRole(groupId: string, role: GroupMemberRoleValue, transaction?: unknown): Promise<number>;
  getStudentMemberUserIds(groupId: string, transaction?: unknown): Promise<string[]>;
  countOtherActiveStudentGroupMemberships(userId: string, excludedGroupId: string, transaction?: unknown): Promise<number>;
  acquireTransactionLock(key: string, transaction: unknown): Promise<void>;
  getViews(groupId: string): Promise<GroupMemberView[]>;
  save(member: GroupMember, transaction?: unknown): Promise<void>;
  delete(member: GroupMember, transaction?: unknown): Promise<void>;
}
