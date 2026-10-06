/*
 * Funcionalidad: Caso de uso UpdateGroupUseCase
 * Descripción: Actualiza nombre, descripción, periodo, año académico, cupo o estado activo de un grupo existente dentro del alcance de gestión del ejecutor; al reactivar un grupo STUDENT verifica, bajo pg_advisory_xact_lock por estudiante, que ningún miembro pertenezca a otro grupo STUDENT activo
 * Versión: 1.2
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
import { UpdateGroupCommand } from "@/features/groups/application/commands/update-group.command";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError, StudentAlreadyInGroupError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { studentMembershipLockKey } from "@/features/groups/domain/services/group-membership-policy";

/**
 * @throws {GroupNotFoundError} If the group does not exist
 * @throws {GroupManagementForbiddenError} If the caller cannot manage the group
 * @throws {StudentAlreadyInGroupError} If reactivating a student group whose member already belongs to another active student group
 */
@Injectable()
export class UpdateGroupUseCase {
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

  public async execute(command: UpdateGroupCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const group: Group | undefined = await this._groupsRepository.getById(command.groupId, transaction);

      if (!group) {
        throw new GroupNotFoundError();
      }

      await this._groupAccessService.assertCanManage({ id: command.performedBy, role: command.performedByRole }, group, transaction);

      if (command.isActive === true && !group.isActive && group.isStudentGroup()) {
        await this._assertStudentsFreeToRejoin(group.id, transaction);
      }

      group.update(
        {
          name: command.name,
          description: command.description,
          semester: command.semester,
          academicYear: command.academicYear,
          maxStudents: command.maxStudents,
          isActive: command.isActive,
        },
        command.performedBy,
      );

      await this._groupsRepository.save(group, transaction);

      return group.getEvents();
    });

    this._eventBus.publish(events);
  }

  private async _assertStudentsFreeToRejoin(groupId: string, transaction: unknown): Promise<void> {
    const studentIds: string[] = await this._groupMembersRepository.getStudentMemberUserIds(groupId, transaction);
    const orderedIds: string[] = [...studentIds].sort();

    // Locks are taken in a stable order so concurrent reactivations and member additions cannot deadlock
    for (const studentId of orderedIds) {
      await this._groupMembersRepository.acquireTransactionLock(studentMembershipLockKey(studentId), transaction);
    }

    for (const studentId of orderedIds) {
      const otherGroups: number = await this._groupMembersRepository.countOtherActiveStudentGroupMemberships(studentId, groupId, transaction);

      if (otherGroups > 0) {
        throw new StudentAlreadyInGroupError();
      }
    }
  }
}
