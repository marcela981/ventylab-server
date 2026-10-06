/*
 * Funcionalidad: Lector de sesiones del simulador para evaluaciones
 * Descripción: Lee con PrismaService, de solo lectura, el registro de parámetros (parametersLog) de una sesión del simulador por su ID para calificar preguntas prácticas y su propietario (ISimulationSessionOwnership) para validar respuestas SIMULATION; el módulo de simulación no expone una consulta por ID
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ISimulationSessionOwnership } from "@/features/evaluation/application/ports/simulation-session-ownership.interface";

export const SIMULATOR_SESSION_READER_TOKEN: unique symbol = Symbol("SIMULATOR_SESSION_READER_TOKEN");

export interface ISimulatorSessionReader {
  getParametersLog(sessionId: string): Promise<unknown[] | undefined>;
}

@Injectable()
export class PrismaSimulatorSessionReader implements ISimulatorSessionReader, ISimulationSessionOwnership {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getParametersLog(sessionId: string): Promise<unknown[] | undefined> {
    const row: { parametersLog: Prisma.JsonValue } | null = await this._prisma.simulatorSession.findUnique({
      where: { id: sessionId },
      select: { parametersLog: true },
    });

    if (!row) {
      return undefined;
    }

    return Array.isArray(row.parametersLog) ? row.parametersLog : [];
  }

  public async getSessionOwnerId(sessionId: string): Promise<string | undefined> {
    const row: { userId: string } | null = await this._prisma.simulatorSession.findUnique({ where: { id: sessionId }, select: { userId: true } });

    return row?.userId;
  }
}
