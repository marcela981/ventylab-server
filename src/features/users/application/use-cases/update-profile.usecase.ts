/*
 * Funcionalidad: Caso de uso UpdateProfileUseCase
 * Descripción: Actualiza nombre e imagen del perfil del usuario y publica sus eventos de dominio
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
import { UpdateProfileCommand } from "@/features/users/application/commands/update-profile.command";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the user does not exist
 */
@Injectable()
export class UpdateProfileUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateProfileCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const user: User | undefined = await this._usersRepository.getById(command.userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      user.updateProfile({
        name: command.name,
        image: command.image === "" ? null : command.image,
        performedBy: command.performedBy,
      });

      await this._usersRepository.save(user, transaction);

      this._eventBus.publish(user.getEvents());
    });
  }
}
