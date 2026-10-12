/*
 * Funcionalidad: Manejadores GroupRoomsEventsHandlers
 * Descripción: Mantiene las salas Socket.io group:{id}: al autenticarse un socket (realtime.client-authenticated) une al usuario a las salas de los grupos de los que es miembro, lo une o lo saca al agregarlo o quitarlo de un grupo y vacía la sala al eliminar el grupo; depende de IGroupsRepository e IRealtimePublisher
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import {
  groupRoom,
  type IRealtimePublisher,
  REALTIME_CLIENT_AUTHENTICATED_EVENT,
  REALTIME_PUBLISHER_TOKEN,
  type RealtimeClientAuthenticatedPayload,
} from "@/common/application/ports/realtime-publisher.interface";
import { GroupMemberAddedEvent, GroupMemberRemovedEvent } from "@/features/groups/domain/events/group-member.events";
import { GroupDeletedEvent } from "@/features/groups/domain/events/group.events";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

@Injectable()
export class GroupRoomsEventsHandlers {
  private readonly _logger: Logger = new Logger(GroupRoomsEventsHandlers.name);

  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(REALTIME_CLIENT_AUTHENTICATED_EVENT, { async: true })
  public async handleClientAuthenticated(payload: RealtimeClientAuthenticatedPayload): Promise<void> {
    try {
      const groupIds: string[] = await this._groupsRepository.getGroupIdsForUser(payload.userId);

      for (const groupId of groupIds) {
        this._realtimePublisher.joinRoom(payload.userId, groupRoom(groupId));
      }
    } catch (error: unknown) {
      this._logger.warn(`Joining group rooms on authentication failed for user ${payload.userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @OnEvent(GroupMemberAddedEvent.name)
  public handleMemberAdded(event: GroupMemberAddedEvent): void {
    this._realtimePublisher.joinRoom(event.entity.userId, groupRoom(event.entity.groupId));
  }

  @OnEvent(GroupMemberRemovedEvent.name)
  public handleMemberRemoved(event: GroupMemberRemovedEvent): void {
    this._realtimePublisher.leaveRoom(event.entity.userId, groupRoom(event.entity.groupId));
  }

  @OnEvent(GroupDeletedEvent.name)
  public handleGroupDeleted(event: GroupDeletedEvent): void {
    this._realtimePublisher.clearRoom(groupRoom(event.entity.id));
  }
}
