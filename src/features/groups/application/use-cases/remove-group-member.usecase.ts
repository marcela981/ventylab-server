/*
 * Funcionalidad: Caso de uso RemoveGroupMemberUseCase
 * Descripción: Retira a un usuario de un grupo dentro del alcance de gestión del ejecutor; bajo pg_advisory_xact_lock por grupo, si era el líder anula simulatorLeaderId en la misma transacción
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { RemoveGroupMemberCommand } from "@/features/groups/application/commands/remove-group-member.command";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupMemberNotFoundError, GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { groupLeadershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

/**
 * @throws {GroupNotFoundError} If the group does not exist
 * @throws {GroupManagementForbiddenError} If the caller cannot manage the group
 * @throws {GroupMemberNotFoundError} If the user is not a member of the group
 */
@Injectable()
export class RemoveGroupMemberUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
    private readonly _groupAccessService: GroupAccessService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RemoveGroupMemberCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const group: Group | undefined = await this._groupsRepository.getById(command.groupId, transaction);

      if (!group) {
        throw new GroupNotFoundError();
      }

      await this._groupAccessService.assertCanManage({ id: command.performedBy, role: command.performedByRole }, group, transaction);
      await this._groupMembersRepository.acquireTransactionLock(groupLeadershipLockKey(group.id), transaction);

      const member: GroupMember | undefined = await this._groupMembersRepository.getByGroupAndUser(group.id, command.userId, transaction);

      if (!member) {
        throw new GroupMemberNotFoundError();
      }

      const groupEvents: DomainEvent[] = [];

      if (member.isLeader() || group.isLedBy(command.userId)) {
        group.changeSimulatorLead(undefined, command.performedBy);

        await this._groupsRepository.save(group, transaction);

        groupEvents.push(...group.getEvents());
      }

      member.remove(command.performedBy);

      await this._groupMembersRepository.delete(member, transaction);

      return [...groupEvents, ...member.getEvents()];
    });

    this._eventBus.publish(events);
  }
}
