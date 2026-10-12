/*
 * Funcionalidad: Módulo DatabaseModule
 * Descripción: Módulo global que provee PrismaService, el gestor de transacciones y la sonda de salud de la base de datos (DATABASE_HEALTH_PROBE_TOKEN)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { DATABASE_HEALTH_PROBE_TOKEN } from "@/common/application/ports/database-health-probe.interface";
import { PrismaDatabaseHealthProbe } from "@/common/infrastructure/persistence/prisma/prisma-database-health.probe";
import { PrismaTransactionManager } from "@/common/infrastructure/persistence/prisma/prisma-transaction.manager";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: TRANSACTION_MANAGER_TOKEN,
      useClass: PrismaTransactionManager,
    },
    { provide: DATABASE_HEALTH_PROBE_TOKEN, useClass: PrismaDatabaseHealthProbe },
  ],
  exports: [PrismaService, TRANSACTION_MANAGER_TOKEN, DATABASE_HEALTH_PROBE_TOKEN],
})
export class DatabaseModule {}
