/*
 * Funcionalidad: Servicio PrismaService
 * Descripción: Cliente único de Prisma que se conecta y desconecta con el ciclo de vida de NestJS
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public constructor(configService: ConfigService<EnvironmentVariables, true>) {
    super({
      datasources: {
        db: { url: configService.get("DATABASE_URL", { infer: true }) },
      },
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
