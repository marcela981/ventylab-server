/*
 * Funcionalidad: Prueba de integración de ajustes de la plataforma
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de ajustes a través de UpdatePlatformSettingUseCase: N actualizaciones simultáneas con la misma versión (serializadas por pg_advisory_xact_lock por clave) dejan exactamente una aplicada con versión 1 y una fila de auditoría, y el resto recibe PlatformSettingVersionConflictError (409); una versión vigente posterior se aplica
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";

import { UpdatePlatformSettingCommand } from "@/features/platform-settings/application/commands/update-platform-setting.command";
import { UpdatePlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/update-platform-setting.usecase";
import { PlatformSettingVersionConflictError } from "@/features/platform-settings/domain/platform-settings.errors";

import { createAdmin } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 8;
const SETTING_KEY: string = "evaluation.passingGrade";

interface SettingRow {
  readonly version: number;
}

describe("platform settings against PostgreSQL", () => {
  let harness: IntegrationApp;
  let admin: User;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    admin = await createAdmin(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  async function storedVersion(): Promise<number | undefined> {
    const rows: SettingRow[] = await harness.prisma.$queryRawUnsafe<SettingRow[]>("SELECT version FROM platform_settings WHERE key = $1", SETTING_KEY);

    return rows[0]?.version;
  }

  it(`should apply exactly one of ${CONCURRENCY} concurrent updates made from the same version`, async () => {
    const useCase: UpdatePlatformSettingUseCase = harness.app.get(UpdatePlatformSettingUseCase);

    const results: PromiseSettledResult<void>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (_value: unknown, index: number): Promise<void> =>
        useCase.execute(new UpdatePlatformSettingCommand({ key: SETTING_KEY, value: 3 + index / 10, version: 0, performedBy: admin.id })),
      ),
    );

    const conflicts: number = results.filter(
      (result: PromiseSettledResult<void>): boolean => result.status === "rejected" && result.reason instanceof PlatformSettingVersionConflictError,
    ).length;

    expect(results.filter((result: PromiseSettledResult<void>): boolean => result.status === "fulfilled")).toHaveLength(1);
    expect(conflicts).toBe(CONCURRENCY - 1);
    expect(await storedVersion()).toBe(1);
    expect(await harness.prisma.auditLog.count({ where: { entityId: SETTING_KEY } })).toBe(1);
  });

  it("should apply a later update made from the current version", async () => {
    const useCase: UpdatePlatformSettingUseCase = harness.app.get(UpdatePlatformSettingUseCase);

    await useCase.execute(new UpdatePlatformSettingCommand({ key: SETTING_KEY, value: 3.5, version: 0, performedBy: admin.id }));
    await useCase.execute(new UpdatePlatformSettingCommand({ key: SETTING_KEY, value: 4, version: 1, performedBy: admin.id }));

    expect(await storedVersion()).toBe(2);
  });
});
