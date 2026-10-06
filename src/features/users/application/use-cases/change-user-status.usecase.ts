/*
 * Funcionalidad: Caso de uso ChangeUserStatusUseCase
 * Descripción: Activa o desactiva la cuenta de un usuario en una sola transacción (estado, revocación de refresh tokens al desactivar y auditoría) impidiendo desactivar al superadministrador o cambiar el estado propio; publica UserStatusChangedEvent tras el commit
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
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { ChangeUserStatusCommand } from "@/features/users/application/commands/change-user-status.command";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { type User, USER_ENTITY_COLLECTION, USER_STATUS_CHANGED_AUDIT_ACTION } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { isSuperadmin } from "@/features/users/domain/services/is-superadmin";
import { CannotChangeOwnStatusError, SuperadminStatusImmutableError, UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the target user does not exist
 * @throws {SuperadminStatusImmutableError} If the target user is the configured superadmin and the request deactivates them
 * @throws {CannotChangeOwnStatusError} If the actor tries to change their own status
 */
@Injectable()
export class ChangeUserStatusUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
  ) {}

  public async execute(command: ChangeUserStatusCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const user: User | undefined = await this._usersRepository.getById(command.userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      if (!command.isActive && isSuperadmin(user.email, this._superadminEmail)) {
        throw new SuperadminStatusImmutableError();
      }

      if (command.userId === command.performedBy) {
        throw new CannotChangeOwnStatusError();
      }

      if (user.isActive === command.isActive) {
        return [];
      }

      const wasActive: boolean = user.isActive;

      user.changeStatus({ isActive: command.isActive, performedBy: command.performedBy });

      await this._usersRepository.save(user, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        USER_STATUS_CHANGED_AUDIT_ACTION,
        USER_ENTITY_COLLECTION,
        user.id,
        { isActive: wasActive },
        { isActive: user.isActive },
        transaction,
      );

      return user.getEvents();
    });

    if (events.length > 0) {
      this._eventBus.publish(events);
    }
  }
}
