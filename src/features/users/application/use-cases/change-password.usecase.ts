/*
 * Funcionalidad: Caso de uso ChangePasswordUseCase
 * Descripción: Verifica la contraseña actual, guarda la nueva y cierra las sesiones previas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type IPasswordHasher, PASSWORD_HASHER_TOKEN } from "@/common/application/security/password-hasher.interface";
import { ChangePasswordCommand } from "@/features/users/application/commands/change-password.command";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import {
  InvalidCurrentPasswordError,
  PasswordNotSetError,
  SamePasswordError,
  UserNotFoundError,
} from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the user does not exist
 * @throws {PasswordNotSetError} If the user signed up with an external provider and has no password
 * @throws {InvalidCurrentPasswordError} If the current password does not match
 * @throws {SamePasswordError} If the new password equals the current one
 */
@Injectable()
export class ChangePasswordUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly _passwordHasher: IPasswordHasher,
  ) {}

  public async execute(command: ChangePasswordCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const user: User | undefined = await this._usersRepository.getById(command.userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      const currentHash: string | undefined = user.passwordHash;

      if (!currentHash) {
        throw new PasswordNotSetError();
      }

      const isCurrentPasswordValid: boolean = await this._passwordHasher.verify(command.currentPassword, currentHash);

      if (!isCurrentPasswordValid) {
        throw new InvalidCurrentPasswordError();
      }

      const isSamePassword: boolean = await this._passwordHasher.verify(command.newPassword, currentHash);

      if (isSamePassword) {
        throw new SamePasswordError();
      }

      const newPasswordHash: string = await this._passwordHasher.hash(command.newPassword);

      user.changePassword({ newPasswordHash, performedBy: command.performedBy });

      await this._usersRepository.save(user, transaction);

      await this._usersRepository.revokeSessions(user.id, transaction);

      this._eventBus.publish(user.getEvents());
    });
  }
}
