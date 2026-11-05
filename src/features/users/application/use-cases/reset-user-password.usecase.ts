/*
 * Funcionalidad: Caso de uso ResetUserPasswordUseCase
 * Descripción: Fija una contraseña nueva sin pedir la actual (recuperación por correo, Ajustes D3) dentro de la transacción del llamador: la hashea, revoca todos los refresh tokens (refreshTokensRevokedAt) y las sesiones guardadas y publica el evento de cambio de contraseña
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type IPasswordHasher, PASSWORD_HASHER_TOKEN } from "@/common/application/security/password-hasher.interface";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * Runs inside the caller's transaction (the reset token is consumed in the same one).
 * @throws {UserNotFoundError} If the user does not exist
 */
@Injectable()
export class ResetUserPasswordUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly _passwordHasher: IPasswordHasher,
  ) {}

  public async execute({ userId, newPassword }: { userId: string; newPassword: string }, transaction: unknown): Promise<void> {
    const user: User | undefined = await this._usersRepository.getById(userId, transaction);

    if (!user) {
      throw new UserNotFoundError();
    }

    user.changePassword({ newPasswordHash: await this._passwordHasher.hash(newPassword), performedBy: userId });

    await this._usersRepository.save(user, transaction);
    await this._usersRepository.revokeSessions(user.id, transaction);

    this._eventBus.publish(user.getEvents());
  }
}
