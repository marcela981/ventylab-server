/*
 * Funcionalidad: Módulo EventsModule
 * Descripción: Módulo global que configura EventEmitter y enlaza IEventBus con NestEventBus
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { EVENT_BUS_TOKEN } from "@/common/application/events/event-bus.interface";
import { NestEventBus } from "@/common/infrastructure/events/nest-event-bus";

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: EVENT_BUS_TOKEN,
      useClass: NestEventBus,
    },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventsModule {}
