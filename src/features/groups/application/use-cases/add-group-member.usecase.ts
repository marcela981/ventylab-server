/*
 * Funcionalidad: Caso de uso AddGroupMemberUseCase
 * Descripción: Agrega un usuario existente a un grupo dentro del alcance de gestión del ejecutor; valida que el rol del usuario sea admitido por el tipo del grupo, que un estudiante no pertenezca a otro grupo STUDENT activo (bajo pg_advisory_xact_lock por estudiante) y el cupo máximo; la membresía nace como MEMBER con el rol heredado derivado del rol del usuario
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
import { AddGroupMemberCommand } from "@/features/groups/application/commands/add-group-member.command";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import {
  GroupFullError,
  GroupMemberRoleNotAllowedError,
  GroupNotFoundError,
  GroupUserNotFoundError,
  StudentAlreadyInGroupError,
} from "@/features/groups/domain/groups.errors";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import {
  isStudentUserRole,
  isUserRoleAllowedInGroup,
  legacyMemberRoleFor,
  studentMembershipLockKey,
} from "@/features/groups/domain/services/group-membership-policy";
import { type GroupMemberRoleValue, STUDENT_MEMBER_ROLE } from "@/features/groups/domain/value-objects/group-member-role";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

/**
 * @throws {GroupNotFoundError} If the group does not exist
 * @throws {GroupManagementForbiddenError} If the caller cannot manage the group
 * @throws {GroupUserNotFoundError} If the user to add does not exist
 * @throws {GroupMemberRoleNotAllowedError} If the user's role is not allowed in this type of group
 * @throws {StudentAlreadyInGroupError} If the student already belongs to another active student group
 * @throws {GroupFullError} If the group already reached its student limit
 */
@Injectable()
export class AddGroupMemberUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
    private readonly _usersFacade: UsersFacade,
    private readonly _groupAccessService: GroupAccessService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: AddGroupMemberCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const group: Group | undefined = await this._groupsRepository.getById(command.groupId, transaction);

      if (!group) {
        throw new GroupNotFoundError();
      }

      await this._groupAccessService.assertCanManage({ id: command.performedBy, role: command.performedByRole }, group, transaction);

      const user: UserAccount | undefined = await this._usersFacade.getUserById(command.userId);

      if (!user) {
        throw new GroupUserNotFoundError();
      }

      if (!isUserRoleAllowedInGroup(group.type, user.role)) {
        throw new GroupMemberRoleNotAllowedError();
      }

      if (group.isStudentGroup() && isStudentUserRole(user.role)) {
        await this._groupMembersRepository.acquireTransactionLock(studentMembershipLockKey(user.id), transaction);

        const otherGroups: number = await this._groupMembersRepository.countOtherActiveStudentGroupMemberships(user.id, group.id, transaction);

        if (otherGroups > 0) {
          throw new StudentAlreadyInGroupError();
        }
      }

      const legacyRole: GroupMemberRoleValue = legacyMemberRoleFor(user.role);
      const existing: GroupMember | undefined = await this._groupMembersRepository.getByGroupAndUser(group.id, user.id, transaction);

      if (!existing && legacyRole === STUDENT_MEMBER_ROLE && group.maxStudents) {
        const students: number = await this._groupMembersRepository.countByRole(group.id, STUDENT_MEMBER_ROLE, transaction);

        if (students >= group.maxStudents) {
          throw new GroupFullError(group.maxStudents);
        }
      }

      const member: GroupMember = existing ?? GroupMember.create({
        groupId: group.id,
        userId: user.id,
        role: legacyRole,
        performedBy: command.performedBy,
      });

      if (existing) {
        existing.changeRole(legacyRole, command.performedBy);
      }

      await this._groupMembersRepository.save(member, transaction);

      return member.getEvents();
    });

    this._eventBus.publish(events);
  }
}
