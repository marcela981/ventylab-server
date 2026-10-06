/*
 * Funcionalidad: Módulo AuthorizationModule
 * Descripción: Registra el controlador y el servicio de autorización
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { AuthorizationService } from "@/features/authorization/application/authorization.service";
import { AuthorizationController } from "@/features/authorization/presentation/controllers/authorization.controller";

@Module({
  imports: [AuthModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
})
export class AuthorizationModule {}
