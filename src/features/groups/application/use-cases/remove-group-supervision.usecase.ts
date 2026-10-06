/*
 * Funcionalidad: Caso de uso RemoveGroupSupervisionUseCase
 * Descripción: Quita el vínculo de supervisión entre un grupo TEACHER y un grupo STUDENT y lo audita en el grupo TEACHER dentro de la misma transacción
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { RemoveGroupSupervisionCommand } from "@/features/groups/application/commands/remove-group-supervision.command";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError, GroupSupervisionNotFoundError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_SUPERVISIONS_REPOSITORY_TOKEN,
  type IGroupSupervisionsRepository,
} from "@/features/groups/domain/repositories/group-supervisions.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

/**
 * @throws {GroupNotFoundError} If the teacher group does not exist
 * @throws {GroupSupervisionNotFoundError} If the link does not exist
 */
@Injectable()
export class RemoveGroupSupervisionUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_SUPERVISIONS_REPOSITORY_TOKEN)
    private readonly _groupSupervisionsRepository: IGroupSupervisionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RemoveGroupSupervisionCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const teacherGroup: Group | undefined = await this._groupsRepository.getById(command.teacherGroupId, transaction);

      if (!teacherGroup) {
        throw new GroupNotFoundError();
      }

      const exists: boolean = await this._groupSupervisionsRepository.exists(teacherGroup.id, command.studentGroupId, transaction);

      if (!exists) {
        throw new GroupSupervisionNotFoundError();
      }

      await this._groupSupervisionsRepository.remove(teacherGroup.id, command.studentGroupId, transaction);

      teacherGroup.recordSupervisionRemoved(command.studentGroupId, command.performedBy);

      await this._groupsRepository.save(teacherGroup, transaction);

      return teacherGroup.getEvents();
    });

    this._eventBus.publish(events);
  }
}
