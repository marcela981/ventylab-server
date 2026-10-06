/*
 * Funcionalidad: Gestor PrismaTransactionManager
 * Descripción: Implementa ITransactionManager con transacciones interactivas de Prisma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type PrismaTransaction } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

@Injectable()
export class PrismaTransactionManager implements ITransactionManager {
  public constructor(private readonly _prisma: PrismaService) {}

  public async run<T>(work: (transaction: unknown) => Promise<T>): Promise<T> {
    return await this._prisma.$transaction(async (tx: PrismaTransaction): Promise<T> => {
      return await work(tx);
    });
  }
}
