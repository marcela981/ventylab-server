/*
 * Funcionalidad: Caso de uso ChangeUserRoleUseCase
 * Descripción: Cambia el rol de un usuario en una sola transacción (rol, salida de los grupos que ya no corresponden, liderazgo de simulador, revocación de refresh tokens y auditoría) impidiendo modificar al superadministrador o el rol propio; publica UserRoleChangedEvent tras el commit
 * Versión: 1.3
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
import { ChangeUserRoleCommand } from "@/features/users/application/commands/change-user-role.command";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { type User, USER_ENTITY_COLLECTION, USER_ROLE_CHANGED_AUDIT_ACTION } from "@/features/users/domain/entities/user.entity";
import {
  type IUserGroupMembershipsRepository,
  USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN,
} from "@/features/users/domain/repositories/user-group-memberships.repository";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { isSuperadmin } from "@/features/users/domain/services/is-superadmin";
import { groupTypesToLeave, type MembershipGroupTypeValue } from "@/features/users/domain/services/role-change-group-cleanup";
import { CannotChangeOwnRoleError, SuperadminRoleImmutableError, UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole, type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

/**
 * @throws {InvalidValueObjectError} If the role is not a valid user role
 * @throws {UserNotFoundError} If the target user does not exist
 * @throws {SuperadminRoleImmutableError} If the target user is the configured superadmin, even when acting on themself
 * @throws {CannotChangeOwnRoleError} If the actor tries to change their own role
 */
@Injectable()
export class ChangeUserRoleUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN)
    private readonly _membershipsRepository: IUserGroupMembershipsRepository,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
  ) {}

  public async execute(command: ChangeUserRoleCommand): Promise<void> {
    const role: UserRole = UserRole.create(command.role);

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const user: User | undefined = await this._usersRepository.getById(command.userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      if (isSuperadmin(user.email, this._superadminEmail)) {
        throw new SuperadminRoleImmutableError();
      }

      if (command.userId === command.performedBy) {
        throw new CannotChangeOwnRoleError();
      }

      if (user.role.equals(role)) {
        return [];
      }

      const previousRole: UserRoleValue = user.role.value;

      user.changeRole({ role, performedBy: command.performedBy });

      await this._usersRepository.save(user, transaction);

      const groupTypes: MembershipGroupTypeValue[] = groupTypesToLeave(previousRole, role.value);
      const removedGroupIds: string[] = await this._membershipsRepository.removeFromGroupTypes(user.id, groupTypes, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        USER_ROLE_CHANGED_AUDIT_ACTION,
        USER_ENTITY_COLLECTION,
        user.id,
        { role: previousRole },
        { role: role.value, removedGroupIds },
        transaction,
      );

      return user.getEvents();
    });

    if (events.length > 0) {
      this._eventBus.publish(events);
    }
  }
}
