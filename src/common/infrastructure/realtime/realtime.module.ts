/*
 * Funcionalidad: Módulo RealtimeModule
 * Descripción: Módulo global que registra RealtimeGateway y lo expone como REALTIME_PUBLISHER_TOKEN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { RealtimeGateway } from "@/common/infrastructure/realtime/realtime.gateway";

@Global()
@Module({
  providers: [
    RealtimeGateway,
    {
      provide: REALTIME_PUBLISHER_TOKEN,
      useExisting: RealtimeGateway,
    },
  ],
  exports: [REALTIME_PUBLISHER_TOKEN],
})
export class RealtimeModule {}
