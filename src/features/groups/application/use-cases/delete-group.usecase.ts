/*
 * Funcionalidad: Caso de uso DeleteGroupUseCase
 * Descripción: Elimina un grupo sin subgrupos dentro del alcance de gestión del ejecutor: lo borra físicamente solo si nunca tuvo actividad (miembros actuales o pasados, asignaciones, entregas ni reservas) y en otro caso lo desactiva; devuelve qué ocurrió
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
import { DeleteGroupCommand } from "@/features/groups/application/commands/delete-group.command";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupHasSubgroupsError, GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

export type DeleteGroupOutcome = "deleted" | "deactivated";

/**
 * @throws {GroupNotFoundError} If the group does not exist
 * @throws {GroupManagementForbiddenError} If the caller cannot manage the group
 * @throws {GroupHasSubgroupsError} If the group still has subgroups
 */
@Injectable()
export class DeleteGroupUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    private readonly _groupAccessService: GroupAccessService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: DeleteGroupCommand): Promise<DeleteGroupOutcome> {
    const { outcome, events }: { outcome: DeleteGroupOutcome; events: DomainEvent[] } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ outcome: DeleteGroupOutcome; events: DomainEvent[] }> => {
        const group: Group | undefined = await this._groupsRepository.getById(command.groupId, transaction);

        if (!group) {
          throw new GroupNotFoundError();
        }

        await this._groupAccessService.assertCanManage({ id: command.performedBy, role: command.performedByRole }, group, transaction);

        const subgroups: number = await this._groupsRepository.countSubgroups(group.id, transaction);

        if (subgroups > 0) {
          throw new GroupHasSubgroupsError();
        }

        const hasHistory: boolean = await this._groupsRepository.hasActivityHistory(group.id, transaction);

        if (hasHistory) {
          group.deactivate(command.performedBy);

          await this._groupsRepository.save(group, transaction);

          return { outcome: "deactivated", events: group.getEvents() };
        }

        group.delete(command.performedBy);

        await this._groupsRepository.delete(group, transaction);

        return { outcome: "deleted", events: group.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return outcome;
  }
}
