/*
 * Funcionalidad: Caso de uso ResetPasswordUseCase
 * Descripción: Restablece la contraseña con el token del enlace de recuperación (Ajustes D3): en una transacción busca el token vigente por su hash, lo consume (un solo uso) y fija la contraseña nueva con ResetUserPasswordUseCase, que revoca todos los refresh tokens; un token desconocido, vencido o ya usado responde PasswordResetTokenInvalidError
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { hashPasswordResetToken } from "@/features/auth/application/helpers/password-reset-token.helper";
import { PasswordResetTokenInvalidError } from "@/features/auth/domain/auth.errors";
import {
  type IPasswordResetTokensRepository,
  PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN,
  type PasswordResetTokenRecord,
} from "@/features/auth/domain/repositories/password-reset-tokens.repository";
import { ResetUserPasswordUseCase } from "@/features/users/application/use-cases/reset-user-password.usecase";

/**
 * @throws {PasswordResetTokenInvalidError} If the token is unknown, expired or already used
 */
@Injectable()
export class ResetPasswordUseCase {
  public constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN)
    private readonly _tokensRepository: IPasswordResetTokensRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    private readonly _resetUserPasswordUseCase: ResetUserPasswordUseCase,
  ) {}

  public async execute({ token, newPassword }: { token: string; newPassword: string }, now: Date = new Date()): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const record: PasswordResetTokenRecord | undefined = await this._tokensRepository.findValid(hashPasswordResetToken(token), now, transaction);

      if (!record || !(await this._tokensRepository.consume(record.id, now, transaction))) {
        throw new PasswordResetTokenInvalidError();
      }

      await this._resetUserPasswordUseCase.execute({ userId: record.userId, newPassword }, transaction);
    });
  }
}
