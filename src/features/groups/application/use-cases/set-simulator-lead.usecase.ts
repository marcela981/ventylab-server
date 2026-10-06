/*
 * Funcionalidad: Caso de uso SetSimulatorLeadUseCase
 * Descripción: Asigna el líder de un grupo STUDENT dentro del alcance de gestión del ejecutor, o lo limpia cuando no se envía usuario; bajo pg_advisory_xact_lock por grupo degrada al LEADER anterior a MEMBER, promueve al nuevo y sincroniza simulatorLeaderId en la misma transacción
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
import { SetSimulatorLeadCommand } from "@/features/groups/application/commands/set-simulator-lead.command";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupLeaderNotAllowedError, GroupNotFoundError, SimulatorLeadNotMemberError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { groupLeadershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

/**
 * @throws {GroupNotFoundError} If the group does not exist
 * @throws {GroupManagementForbiddenError} If the caller cannot manage the group
 * @throws {GroupLeaderNotAllowedError} If a leader is assigned to a group that is not a student group
 * @throws {SimulatorLeadNotMemberError} If the new leader is not a member of the group
 */
@Injectable()
export class SetSimulatorLeadUseCase {
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

  public async execute(command: SetSimulatorLeadCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const group: Group | undefined = await this._groupsRepository.getById(command.groupId, transaction);

      if (!group) {
        throw new GroupNotFoundError();
      }

      await this._groupAccessService.assertCanManage({ id: command.performedBy, role: command.performedByRole }, group, transaction);

      if (command.userId && !group.isStudentGroup()) {
        throw new GroupLeaderNotAllowedError();
      }

      await this._groupMembersRepository.acquireTransactionLock(groupLeadershipLockKey(group.id), transaction);

      const newLeader: GroupMember | undefined = command.userId
        ? await this._groupMembersRepository.getByGroupAndUser(group.id, command.userId, transaction)
        : undefined;

      if (command.userId && !newLeader) {
        throw new SimulatorLeadNotMemberError();
      }

      const currentLeaders: GroupMember[] = await this._groupMembersRepository.getLeaders(group.id, transaction);
      const changed: GroupMember[] = [];

      for (const leader of currentLeaders) {
        if (leader.userId !== newLeader?.userId) {
          leader.demoteToMember(command.performedBy);
          changed.push(leader);
        }
      }

      if (newLeader && !newLeader.isLeader()) {
        newLeader.promoteToLeader(command.performedBy);
        changed.push(newLeader);
      }

      for (const member of changed) {
        await this._groupMembersRepository.save(member, transaction);
      }

      group.changeSimulatorLead(newLeader?.userId, command.performedBy);

      await this._groupsRepository.save(group, transaction);

      return [...changed.flatMap((member: GroupMember) => member.getEvents()), ...group.getEvents()];
    });

    this._eventBus.publish(events);
  }
}
