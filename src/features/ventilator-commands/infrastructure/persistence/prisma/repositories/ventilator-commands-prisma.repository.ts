/*
 * Funcionalidad: Repositorio Prisma de comandos del ventilador
 * Descripción: Guarda cada estado de un comando con upsert en ventilator_commands y lista con paginación en base de datos los comandos de una reserva ordenados por hora de envío
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma, type VentilatorCommand as VentilatorCommandModel } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type GetVentilatorCommandsQuery, type IVentilatorCommandsRepository } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { VentilatorCommandsMapper } from "@/features/ventilator-commands/infrastructure/persistence/prisma/mappers/ventilator-commands.mapper";

@Injectable()
export class VentilatorCommandsPrismaRepository implements IVentilatorCommandsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async save(command: VentilatorCommand, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.VentilatorCommandUncheckedCreateInput = VentilatorCommandsMapper.toPersistence(command);

    await client.ventilatorCommand.upsert({
      where: { id: command.id },
      create: data,
      update: data,
    });
  }

  public async getByReservation(query: GetVentilatorCommandsQuery, transaction?: unknown): Promise<Paginated<VentilatorCommand>> {
    const { reservationId, page, limit, sortOrder } = query;
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const where: Prisma.VentilatorCommandWhereInput = { reservationId };
    const direction: Prisma.SortOrder = sortOrder === "asc" ? "asc" : "desc";

    const [rows, total]: [VentilatorCommandModel[], number] = await Promise.all([
      client.ventilatorCommand.findMany({
        where,
        orderBy: [{ sentAt: { sort: direction, nulls: "last" } }, { createdAt: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.ventilatorCommand.count({ where }),
    ]);

    return new Paginated<VentilatorCommand>({
      items: rows.map((row: VentilatorCommandModel): VentilatorCommand => VentilatorCommandsMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }
}
