/*
 * Funcionalidad: Caso de uso FindOrCreateGoogleUserUseCase
 * Descripción: Resuelve el usuario de un perfil verificado de Google: lo devuelve si ya está vinculado por googleId, lo vincula si existe un usuario con el mismo correo (completando la imagen vacía) o crea uno nuevo sin contraseña mediante CreateUserUseCase
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
import { CreateUserCommand } from "@/features/users/application/commands/create-user.command";
import { FindOrCreateGoogleUserCommand } from "@/features/users/application/commands/find-or-create-google-user.command";
import { CreateUserUseCase } from "@/features/users/application/use-cases/create-user.usecase";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";

/**
 * @throws {UserAlreadyExistsError} If another request created a user with the same email concurrently
 */
@Injectable()
export class FindOrCreateGoogleUserUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _createUserUseCase: CreateUserUseCase,
  ) {}

  public async execute(command: FindOrCreateGoogleUserCommand): Promise<User> {
    const linkedUser: User | undefined = await this._usersRepository.getByGoogleId(command.googleId);

    if (linkedUser) {
      return linkedUser;
    }

    const userByEmail: User | undefined = await this._transactionManager.run(async (transaction: unknown): Promise<User | undefined> => {
      const user: User | undefined = await this._usersRepository.getByEmail(command.email, transaction);

      if (!user) {
        return undefined;
      }

      user.linkGoogleAccount({ googleId: command.googleId, image: command.avatarUrl, performedBy: user.id });

      await this._usersRepository.save(user, transaction);

      this._eventBus.publish(user.getEvents());

      return user;
    });

    if (userByEmail) {
      return userByEmail;
    }

    return await this._createUserUseCase.execute(
      new CreateUserCommand({
        email: command.email,
        name: command.name,
        googleId: command.googleId,
        image: command.avatarUrl,
      }),
    );
  }
}
