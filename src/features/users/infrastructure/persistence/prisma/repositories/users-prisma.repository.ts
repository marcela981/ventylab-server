/*
 * Funcionalidad: Repositorio UsersPrismaRepository
 * Descripción: Implementa IUserRepository con Prisma sobre la tabla de usuarios: listado paginado con filtros de búsqueda (nombre, email o ID exacto), rol, grupo y estado activo, y búsquedas por ID, IDs, email (sin distinguir mayúsculas) y googleId
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type TeacherStudent as TeacherStudentModel, type User as UserModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type User, USER_ENTITY_COLLECTION, USER_ENTITY_TYPE } from "@/features/users/domain/entities/user.entity";
import {
  type GetUsersQuery,
  type IUserRepository,
  type UserSortByValue,
} from "@/features/users/domain/repositories/users.repository";
import { UsersMapper } from "@/features/users/infrastructure/persistence/prisma/mappers/users.mapper";

const SORT_FIELD_MAP: Record<UserSortByValue, keyof Prisma.UserOrderByWithRelationInput> = {
  createdAt: "createdAt",
  name: "name",
  email: "email",
};

@Injectable()
export class UsersPrismaRepository implements IUserRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getAll(query: GetUsersQuery, transaction?: unknown): Promise<Paginated<User>> {
    const { page, limit, search, roles, groupId, isActive, sortBy, sortOrder, ids, createdAtFrom, createdAtTo } = query;

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id: search },
      ];
    }

    if (roles && roles.length > 0) where.role = { in: roles };
    if (ids && ids.length > 0) where.id = { in: ids };
    if (groupId) where.groupMembers = { some: { groupId } };
    if (isActive !== undefined) where.isActive = isActive;

    if (createdAtFrom || createdAtTo) {
      where.createdAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [SORT_FIELD_MAP[sortBy ?? "createdAt"]]: sortOrder === "asc" ? "asc" : "desc",
    };

    const [rows, total] = await Promise.all([
      client.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.user.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: UserModel) => UsersMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }

  public async getById(id: string, transaction?: unknown): Promise<User | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: UserModel | null = await client.user.findUnique({ where: { id } });

    return row ? UsersMapper.toDomain(row) : undefined;
  }

  public async getByIds(ids: readonly string[], transaction?: unknown): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: UserModel[] = await client.user.findMany({ where: { id: { in: [...ids] } } });

    return rows.map((row: UserModel) => UsersMapper.toDomain(row));
  }

  public async getByEmail(email: string, transaction?: unknown): Promise<User | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: UserModel | null = await client.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });

    return row ? UsersMapper.toDomain(row) : undefined;
  }

  public async getByGoogleId(googleId: string, transaction?: unknown): Promise<User | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: UserModel | null = await client.user.findUnique({ where: { googleId } });

    return row ? UsersMapper.toDomain(row) : undefined;
  }

  public async isStudentAssignedToTeacher(teacherId: string, studentId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: TeacherStudentModel | null = await client.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });

    return row !== null;
  }

  public async revokeSessions(userId: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.session.deleteMany({ where: { userId } });
  }

  public async save(user: User, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.UserUncheckedCreateInput = UsersMapper.toPersistence(user);

    await client.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });

    if (user.auditLogs.length > 0) {
      await this._auditLogRepository.save(USER_ENTITY_COLLECTION, USER_ENTITY_TYPE, user.id, user.auditLogs, transaction);
    }
  }
}
