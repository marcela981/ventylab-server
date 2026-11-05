/*
 * Funcionalidad: Caso de uso RequestPasswordResetUseCase
 * Descripción: Pide la recuperación de contraseña de un correo (Ajustes D3): si corresponde a una cuenta activa con contraseña local, invalida sus enlaces pendientes, guarda el hash de un token nuevo de 30 minutos y envía el correo con el enlace; en cualquier otro caso no hace nada. Nunca revela si el correo existe: no lanza errores de negocio y el envío del correo no se espera (un fallo solo se registra)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { EMAIL_SERVICE_TOKEN, type IEmailService, type SendEmailOptions } from "@/common/application/ports/email-service.interface";
import { buildPasswordResetEmail } from "@/features/auth/application/helpers/password-reset-email.helper";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiry,
  passwordResetLink,
} from "@/features/auth/application/helpers/password-reset-token.helper";
import { PASSWORD_RESET_FRONTEND_URL_TOKEN } from "@/features/auth/application/tokens/password-reset-frontend-url.token";
import {
  type IPasswordResetTokensRepository,
  PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN,
} from "@/features/auth/domain/repositories/password-reset-tokens.repository";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly _logger: Logger = new Logger(RequestPasswordResetUseCase.name);

  public constructor(
    private readonly _usersFacade: UsersFacade,
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN)
    private readonly _tokensRepository: IPasswordResetTokensRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly _emailService: IEmailService,
    @Inject(PASSWORD_RESET_FRONTEND_URL_TOKEN)
    private readonly _frontendUrl: string,
  ) {}

  public async execute({ email }: { email: string }, now: Date = new Date()): Promise<void> {
    const account: UserAccount | undefined = await this._usersFacade.getUserByEmail(email);

    // Google-only and inactive accounts cannot sign in with a password: nothing to reset.
    if (!account?.isActive || !account.hasPassword) {
      return;
    }

    const token: string = generatePasswordResetToken();

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._tokensRepository.invalidateForUser(account.id, now, transaction);
      await this._tokensRepository.create({ userId: account.id, tokenHash: hashPasswordResetToken(token), expiresAt: passwordResetExpiry(now) }, transaction);
    });

    const message: SendEmailOptions = buildPasswordResetEmail({ to: account.email, name: account.name, link: passwordResetLink(this._frontendUrl, token) });

    // Not awaited: the response time must not depend on the mail server (nor reveal that the account exists).
    void this._emailService.send(message).catch((error: unknown) => {
      this._logger.warn(`Password reset email for user ${account.id} could not be sent: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
