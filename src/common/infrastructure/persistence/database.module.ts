/*
 * Funcionalidad: Módulo DatabaseModule
 * Descripción: Módulo global que provee PrismaService y el gestor de transacciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
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
  ],
  exports: [PrismaService, TRANSACTION_MANAGER_TOKEN],
})
export class DatabaseModule {}
