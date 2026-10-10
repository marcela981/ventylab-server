/*
 * Funcionalidad: Prueba de integración de concurrencia de reservas
 * Descripción: Opcional (RUN_DB_INTEGRATION=1 y DATABASE_URL con la migración aplicada): lanza 20 creaciones concurrentes de la misma franja contra PostgreSQL con el bloqueo pg_advisory_xact_lock real y comprueba que solo una se cree; borra lo creado al terminar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type DbIntegrationSettings, type EnvironmentVariables, readDbIntegrationSettings } from "@/common/infrastructure/config/env.validation";
import { PrismaTransactionManager } from "@/common/infrastructure/persistence/prisma/prisma-transaction.manager";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { buildGroupsFacade, RecordingEventBus } from "@/features/reservations/application/testing/reservations-test-doubles-spec";
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { CreateReservationUseCase } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { ReservationConflictError } from "@/features/reservations/domain/reservations.errors";
import { ReservationsPrismaRepository } from "@/features/reservations/infrastructure/persistence/prisma/repositories/reservations-prisma.repository";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const SETTINGS: ReservationSettings = {
  maxDurationMinutes: 120,
  slotMinutes: 15,
  maxAdvanceDays: 14,
  maxUpcomingPerStudent: 1000,
  maxUpcomingPerGroup: 1000,
  deviceId: "ventilab-device-001",
};

const MS_PER_DAY: number = 86_400_000;
const SLOT_MS: number = 15 * 60_000;

const integration: DbIntegrationSettings = readDbIntegrationSettings();
const describeIfEnabled: jest.Describe = integration.enabled ? describe : describe.skip;

describeIfEnabled("reservations concurrency against PostgreSQL", () => {
  const config: ConfigService<EnvironmentVariables, true> = { get: (): string | undefined => integration.databaseUrl } as unknown as ConfigService<EnvironmentVariables, true>;
  const db: PrismaService = new PrismaService(config);
  const createdIds: string[] = [];

  afterAll(async () => {
    await db.reservation.deleteMany({ where: { id: { in: createdIds } } });
    await db.$disconnect();
  });

  it("creates exactly one of 20 concurrent reservations for the same slot", async () => {
    const user: { id: string } | null = await db.user.findFirst({ select: { id: true } });

    if (!user) {
      throw new Error("The integration database needs at least one user");
    }

    const auditLogRepository: IAuditLogRepository = { save: (): Promise<void> => Promise.resolve() };
    const auditRecorder: IAuditRecorder = { record: (): Promise<void> => Promise.resolve() };
    const usersFacade: UsersFacade = {
      getUserById: (): Promise<UserAccount | undefined> => Promise.resolve(undefined),
      getUsersByIds: (): Promise<UserAccount[]> => Promise.resolve([]),
    } as unknown as UsersFacade;

    const useCase: CreateReservationUseCase = new CreateReservationUseCase(
      new ReservationsPrismaRepository(db, auditLogRepository),
      new PrismaTransactionManager(db),
      new RecordingEventBus(),
      auditRecorder,
      SETTINGS,
      { now: (): Date => new Date() },
      new ReservationAccessService(buildGroupsFacade()),
      new ReservationViewsService(usersFacade, buildGroupsFacade()),
      usersFacade,
    );

    const startsAt: Date = new Date(Math.floor((Date.now() + 13 * MS_PER_DAY) / SLOT_MS) * SLOT_MS + 3 * SLOT_MS);
    const endsAt: Date = new Date(startsAt.getTime() + SLOT_MS);

    const results: PromiseSettledResult<Reservation>[] = await Promise.allSettled(
      Array.from({ length: 20 }, (): Promise<Reservation> =>
        useCase.execute(
          new CreateReservationCommand({ actorId: user.id, actorRole: "STUDENT", holderType: "USER", userId: user.id, startsAt, endsAt, confirmPreempt: false }),
        ),
      ),
    );

    results.forEach((result: PromiseSettledResult<Reservation>): void => {
      if (result.status === "fulfilled") {
        createdIds.push(result.value.id);
      }
    });

    const conflicts: number = results.filter(
      (result: PromiseSettledResult<Reservation>): boolean => result.status === "rejected" && result.reason instanceof ReservationConflictError,
    ).length;

    expect(createdIds).toHaveLength(1);
    expect(conflicts).toBe(19);
  }, 60_000);
});
