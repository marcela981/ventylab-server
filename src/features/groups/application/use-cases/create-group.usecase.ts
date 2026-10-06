/*
 * Funcionalidad: Caso de uso CreateGroupUseCase
 * Descripción: Crea un grupo raíz o subgrupo (máximo tres niveles) del tipo pedido (el profesor solo crea grupos STUDENT; los TEACHER solo el administrador) y le asigna un código de inscripción libre; el creador queda en createdBy sin membresía, porque el tipo del grupo decide quién puede ser miembro; devuelve el ID del grupo
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
import { CreateGroupCommand } from "@/features/groups/application/commands/create-group.command";
import { Group } from "@/features/groups/domain/entities/group.entity";
import {
  GroupMaxDepthExceededError,
  GroupTypeCreationForbiddenError,
  ParentGroupInactiveError,
  ParentGroupNotFoundError,
} from "@/features/groups/domain/groups.errors";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { ENROLLMENT_CODE_ATTEMPTS, generateEnrollmentCode, MAX_GROUP_DEPTH } from "@/features/groups/domain/services/group-hierarchy";
import { canCreateGroup } from "@/features/groups/domain/services/group-management-policy";

/**
 * @throws {GroupTypeCreationForbiddenError} If the caller is not allowed to create this type of group
 * @throws {ParentGroupNotFoundError} If the parent group does not exist
 * @throws {ParentGroupInactiveError} If the parent group is inactive
 * @throws {GroupMaxDepthExceededError} If the parent group is already at the maximum depth
 */
@Injectable()
export class CreateGroupUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateGroupCommand): Promise<string> {
    if (!canCreateGroup({ id: command.performedBy, role: command.performedByRole }, command.type)) {
      throw new GroupTypeCreationForbiddenError();
    }

    const { id, events }: { id: string; events: DomainEvent[] } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ id: string; events: DomainEvent[] }> => {
        const depth: number = await this._resolveDepth(command.parentGroupId, transaction);
        const enrollmentCode: string = await this._findFreeEnrollmentCode(transaction);

        const group: Group = Group.create({
          name: command.name,
          description: command.description,
          type: command.type,
          parentGroupId: command.parentGroupId,
          depth,
          enrollmentCode,
          semester: command.semester,
          academicYear: command.academicYear,
          maxStudents: command.maxStudents,
          createdBy: command.performedBy,
        });

        await this._groupsRepository.save(group, transaction);

        return { id: group.id, events: group.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return id;
  }

  private async _resolveDepth(parentGroupId: string | undefined, transaction: unknown): Promise<number> {
    if (!parentGroupId) {
      return 0;
    }

    const parent: Group | undefined = await this._groupsRepository.getById(parentGroupId, transaction);

    if (!parent) {
      throw new ParentGroupNotFoundError();
    }

    if (!parent.isActive) {
      throw new ParentGroupInactiveError();
    }

    if (parent.depth >= MAX_GROUP_DEPTH) {
      throw new GroupMaxDepthExceededError(MAX_GROUP_DEPTH + 1);
    }

    return parent.depth + 1;
  }

  private async _findFreeEnrollmentCode(transaction: unknown): Promise<string> {
    let enrollmentCode: string = generateEnrollmentCode();

    for (let attempt: number = 1; attempt < ENROLLMENT_CODE_ATTEMPTS; attempt++) {
      const taken: boolean = await this._groupsRepository.existsByEnrollmentCode(enrollmentCode, transaction);

      if (!taken) {
        break;
      }

      enrollmentCode = generateEnrollmentCode();
    }

    return enrollmentCode;
  }
}
