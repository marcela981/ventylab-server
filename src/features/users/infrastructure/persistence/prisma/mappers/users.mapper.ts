/*
 * Funcionalidad: Mapper de persistencia UsersMapper
 * Descripción: Convierte entre el modelo Prisma User y la entidad de dominio User, incluidos el estado activo, el googleId y la revocación de refresh tokens
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type User as UserModel } from "@prisma/client";

import { User } from "@/features/users/domain/entities/user.entity";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

export class UsersMapper {
  public static toDomain(row: UserModel): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      emailVerified: row.emailVerified ?? undefined,
      name: row.name ?? undefined,
      passwordHash: row.password ?? undefined,
      role: UserRole.create(row.role),
      image: row.image ?? undefined,
      isActive: row.isActive,
      googleId: row.googleId ?? undefined,
      refreshTokensRevokedAt: row.refreshTokensRevokedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ?? null,
      name: user.name ?? null,
      password: user.passwordHash ?? null,
      role: user.role.value,
      image: user.image ?? null,
      isActive: user.isActive,
      googleId: user.googleId ?? null,
      refreshTokensRevokedAt: user.refreshTokensRevokedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
