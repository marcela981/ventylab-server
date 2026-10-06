/*
 * Funcionalidad: Módulo RequestContextModule
 * Descripción: Módulo global que expone RequestContextService
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { RequestContextService } from "@/common/infrastructure/context/request-context.service";

@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class RequestContextModule {}
