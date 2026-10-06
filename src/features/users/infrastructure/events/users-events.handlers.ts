/*
 * Funcionalidad: Manejadores de eventos de usuarios
 * Descripción: Notifica en tiempo real al propio usuario (sala user:{id}) cuando cambia su rol, con el evento user:role-changed, mediante IRealtimePublisher
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN, userRoom } from "@/common/application/ports/realtime-publisher.interface";
import { UserRoleChangedEvent } from "@/features/users/domain/events/user.events";

export const USER_ROLE_CHANGED_REALTIME_EVENT: string = "user:role-changed";

@Injectable()
export class UsersEventsHandlers {
  private readonly _logger: Logger = new Logger(UsersEventsHandlers.name);

  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(UserRoleChangedEvent.name)
  public handleUserRoleChanged(event: UserRoleChangedEvent): void {
    try {
      this._realtimePublisher.emitToRoom(userRoom(event.entity.id), USER_ROLE_CHANGED_REALTIME_EVENT, {
        userId: event.entity.id,
        previousRole: event.previousRole,
        newRole: event.newRole,
      });
    } catch (error) {
      this._logger.warn(`Role change notification failed for user ${event.entity.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
