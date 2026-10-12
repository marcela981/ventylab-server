/*
 * Funcionalidad: Repositorio Prisma de ajustes de la plataforma
 * Descripción: Implementa IPlatformSettingsRepository sobre la tabla platform_settings (lectura de todas las filas, lectura por clave, upsert; una marca de restablecimiento se guarda como JSON null) y el bloqueo transaccional pg_advisory_xact_lock de una clave
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type PlatformSetting as PlatformSettingModel, Prisma } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type PlatformSettingOverride } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { type IPlatformSettingsRepository, type SavePlatformSettingOverride } from "@/features/platform-settings/domain/repositories/platform-settings.repository";

function toOverride(row: PlatformSettingModel): PlatformSettingOverride {
  return { key: row.key, value: row.value, version: row.version, updatedById: row.updatedById ?? undefined, updatedAt: row.updatedAt };
}

@Injectable()
export class PlatformSettingsPrismaRepository implements IPlatformSettingsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getAll(): Promise<PlatformSettingOverride[]> {
    const rows: PlatformSettingModel[] = await this._prisma.platformSetting.findMany({ orderBy: { key: "asc" } });

    return rows.map(toOverride);
  }

  public async getByKey(key: string, transaction?: unknown): Promise<PlatformSettingOverride | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const row: PlatformSettingModel | null = await client.platformSetting.findUnique({ where: { key } });

    return row ? toOverride(row) : undefined;
  }

  public async save(override: SavePlatformSettingOverride, transaction?: unknown): Promise<PlatformSettingOverride> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.PlatformSettingUncheckedCreateInput = {
      key: override.key,
      value: override.value === null ? Prisma.JsonNull : (override.value as Prisma.InputJsonValue),
      version: override.version,
      updatedById: override.updatedById ?? null,
    };
    const row: PlatformSettingModel = await client.platformSetting.upsert({ where: { key: override.key }, create: data, update: data });

    return toOverride(row);
  }

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }
}
