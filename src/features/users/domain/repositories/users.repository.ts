/*
 * Funcionalidad: Repositorio IUserRepository
 * Descripción: Define el contrato, las consultas (búsqueda, rol, grupo y estado activo) y el token de inyección del repositorio de usuarios; el correo se busca sin distinguir mayúsculas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export const USERS_REPOSITORY_TOKEN: unique symbol = Symbol("USERS_REPOSITORY_TOKEN");

export const USER_SORT_BY_VALUES: readonly ["createdAt", "name", "email"] = ["createdAt", "name", "email"] as const;

export type UserSortByValue = (typeof USER_SORT_BY_VALUES)[number];

export interface GetUsersQuery extends ListQuery {
  search?: string;
  roles?: UserRoleValue[];
  groupId?: string;
  isActive?: boolean;
  sortBy?: UserSortByValue;
}

export interface IUserRepository {
  getAll(query: GetUsersQuery, transaction?: unknown): Promise<Paginated<User>>;
  getById(id: string, transaction?: unknown): Promise<User | undefined>;
  getByIds(ids: readonly string[], transaction?: unknown): Promise<User[]>;
  getByEmail(email: string, transaction?: unknown): Promise<User | undefined>;
  getByGoogleId(googleId: string, transaction?: unknown): Promise<User | undefined>;
  isStudentAssignedToTeacher(teacherId: string, studentId: string, transaction?: unknown): Promise<boolean>;
  revokeSessions(userId: string, transaction?: unknown): Promise<void>;
  save(user: User, transaction?: unknown): Promise<void>;
}
