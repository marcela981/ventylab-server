/*
 * Funcionalidad: Caso de uso AddGroupSupervisionUseCase
 * Descripción: Vincula un grupo TEACHER como supervisor de un grupo STUDENT (solo ese sentido); el alta es idempotente y queda auditada en el grupo TEACHER dentro de la misma transacción
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
import { AddGroupSupervisionCommand } from "@/features/groups/application/commands/add-group-supervision.command";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError, InvalidGroupSupervisionError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_SUPERVISIONS_REPOSITORY_TOKEN,
  type IGroupSupervisionsRepository,
} from "@/features/groups/domain/repositories/group-supervisions.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

/**
 * @throws {GroupNotFoundError} If either group does not exist
 * @throws {InvalidGroupSupervisionError} If the link is not from a teacher group to a student group
 */
@Injectable()
export class AddGroupSupervisionUseCase {
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

  public async execute(command: AddGroupSupervisionCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const teacherGroup: Group | undefined = await this._groupsRepository.getById(command.teacherGroupId, transaction);
      const studentGroup: Group | undefined = await this._groupsRepository.getById(command.studentGroupId, transaction);

      if (!teacherGroup || !studentGroup) {
        throw new GroupNotFoundError();
      }

      if (!teacherGroup.isTeacherGroup() || !studentGroup.isStudentGroup()) {
        throw new InvalidGroupSupervisionError();
      }

      const exists: boolean = await this._groupSupervisionsRepository.exists(teacherGroup.id, studentGroup.id, transaction);

      if (exists) {
        return [];
      }

      await this._groupSupervisionsRepository.add(teacherGroup.id, studentGroup.id, transaction);

      teacherGroup.recordSupervisionAdded(studentGroup.id, command.performedBy);

      await this._groupsRepository.save(teacherGroup, transaction);

      return teacherGroup.getEvents();
    });

    this._eventBus.publish(events);
  }
}
