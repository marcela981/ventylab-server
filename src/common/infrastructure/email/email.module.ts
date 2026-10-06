/*
 * Funcionalidad: Módulo EmailModule
 * Descripción: Módulo global que enlaza IEmailService con NodemailerEmailService usando ConfigService
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EMAIL_SERVICE_TOKEN, type IEmailService } from "@/common/application/ports/email-service.interface";
import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { NodemailerEmailService } from "@/common/infrastructure/email/nodemailer-email.service";

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SERVICE_TOKEN,
      useFactory: (cs: ConfigService<EnvironmentVariables, true>): IEmailService =>
        new NodemailerEmailService(cs),
      inject: [ConfigService],
    },
  ],
  exports: [EMAIL_SERVICE_TOKEN],
})
export class EmailModule {}
