/*
 * Funcionalidad: Repositorio PasswordResetTokensPrismaRepository
 * Descripción: Implementación con Prisma de IPasswordResetTokensRepository sobre la tabla password_reset_tokens; el consumo es condicional (used_at nulo) para que un token sirva una sola vez aun con peticiones simultáneas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type IPasswordResetTokensRepository,
  type PasswordResetTokenRecord,
} from "@/features/auth/domain/repositories/password-reset-tokens.repository";

@Injectable()
export class PasswordResetTokensPrismaRepository implements IPasswordResetTokensRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async create({ userId, tokenHash, expiresAt }: { userId: string; tokenHash: string; expiresAt: Date }, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  public async invalidateForUser(userId: string, now: Date, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  }

  public async findValid(tokenHash: string, now: Date, transaction?: unknown): Promise<PasswordResetTokenRecord | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: { id: string; userId: string } | null = await client.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true },
    });

    return row ?? undefined;
  }

  public async consume(id: string, now: Date, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const { count } = await client.passwordResetToken.updateMany({ where: { id, usedAt: null }, data: { usedAt: now } });

    return count === 1;
  }
}
