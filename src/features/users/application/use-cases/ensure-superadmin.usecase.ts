/*
 * Funcionalidad: Caso de uso EnsureSuperadminUseCase
 * Descripción: Garantiza que la cuenta configurada en SUPERADMIN_EMAIL, si existe (correo sin distinguir mayúsculas), tenga rol ADMIN y esté activa (saliendo de los grupos de estudiantes si venía de STUDENT); audita la corrección y publica los eventos tras el commit
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
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { type User, USER_ENTITY_COLLECTION } from "@/features/users/domain/entities/user.entity";
import {
  type IUserGroupMembershipsRepository,
  USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN,
} from "@/features/users/domain/repositories/user-group-memberships.repository";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { groupTypesToLeave } from "@/features/users/domain/services/role-change-group-cleanup";
import { UserRole, type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export type EnsureSuperadminOutcome = "not_configured" | "not_found" | "unchanged" | "updated";

export const SUPERADMIN_ENFORCED_AUDIT_ACTION: string = "superadmin_enforced";

@Injectable()
export class EnsureSuperadminUseCase {
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

  public async execute(): Promise<EnsureSuperadminOutcome> {
    const superadminEmail: string = this._superadminEmail.trim();

    if (superadminEmail.length === 0) {
      return "not_configured";
    }

    const { outcome, events } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ outcome: EnsureSuperadminOutcome; events: DomainEvent[] }> => {
        const user: User | undefined = await this._usersRepository.getByEmail(superadminEmail, transaction);

        if (!user) {
          return { outcome: "not_found", events: [] };
        }

        if (user.role.isAdmin() && user.isActive) {
          return { outcome: "unchanged", events: [] };
        }

        const previousRole: UserRoleValue = user.role.value;
        const before: Record<string, unknown> = { role: previousRole, isActive: user.isActive };

        user.changeRole({ role: UserRole.admin() });
        user.changeStatus({ isActive: true });

        await this._usersRepository.save(user, transaction);

        const removedGroupIds: string[] = await this._membershipsRepository.removeFromGroupTypes(
          user.id,
          groupTypesToLeave(previousRole, user.role.value),
          transaction,
        );

        await this._auditRecorder.record(
          undefined,
          SUPERADMIN_ENFORCED_AUDIT_ACTION,
          USER_ENTITY_COLLECTION,
          user.id,
          before,
          { role: user.role.value, isActive: user.isActive, removedGroupIds },
          transaction,
        );

        return { outcome: "updated", events: user.getEvents() };
      },
    );

    if (events.length > 0) {
      this._eventBus.publish(events);
    }

    return outcome;
  }
}
