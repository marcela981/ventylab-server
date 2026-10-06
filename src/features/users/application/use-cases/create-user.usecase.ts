/*
 * Funcionalidad: Caso de uso CreateUserUseCase
 * Descripción: Crea un usuario (con contraseña o con cuenta de Google) validando que el correo no exista; asigna ADMIN si el correo es el del superadmin y STUDENT en cualquier otro caso, y publica su evento de creación
 * Versión: 1.1
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
import { CreateUserCommand } from "@/features/users/application/commands/create-user.command";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { isSuperadmin } from "@/features/users/domain/services/is-superadmin";
import { UserAlreadyExistsError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

/**
 * @throws {UserAlreadyExistsError} If a user with the given email already exists
 */
@Injectable()
export class CreateUserUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly _passwordHasher: IPasswordHasher,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
  ) {}

  public async execute(command: CreateUserCommand): Promise<User> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<User> => {
      const existingUser: User | undefined = await this._usersRepository.getByEmail(command.email, transaction);

      if (existingUser) {
        throw new UserAlreadyExistsError(command.email);
      }

      const passwordHash: string | undefined = command.password ? await this._passwordHasher.hash(command.password) : undefined;
      const role: UserRole = isSuperadmin(command.email, this._superadminEmail) ? UserRole.admin() : UserRole.student();

      const user: User = User.create({
        email: command.email,
        name: command.name,
        passwordHash,
        role,
        image: command.image,
        googleId: command.googleId,
        performedBy: command.performedBy,
      });

      await this._usersRepository.save(user, transaction);

      this._eventBus.publish(user.getEvents());

      return user;
    });
  }
}
