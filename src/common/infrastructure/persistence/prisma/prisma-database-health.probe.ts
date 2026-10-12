/*
 * Funcionalidad: Sonda de salud de la base de datos
 * Descripción: Implementa IDatabaseHealthProbe con PrismaService ejecutando SELECT 1
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type IDatabaseHealthProbe } from "@/common/application/ports/database-health-probe.interface";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

@Injectable()
export class PrismaDatabaseHealthProbe implements IDatabaseHealthProbe {
  public constructor(private readonly _prisma: PrismaService) {}

  public async ping(): Promise<void> {
    await this._prisma.$queryRaw`SELECT 1`;
  }
}
