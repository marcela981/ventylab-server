/*
 * Funcionalidad: Dobles de prueba de reservas
 * Descripción: Repositorio en memoria con bloqueo del dispositivo como mutex asíncrono real, gestor de transacciones que libera el bloqueo al terminar, fachadas de usuarios y grupos simuladas (incluida la gestión de un grupo por el docente que lo supervisa), reloj fijo, bus de eventos y grabador de auditoría espías, y fábricas de los casos de uso; incluye un repositorio de analítica vacío para construir ReservationsFacade; el contexto admite otra configuración de reservas; usuarios con código de estudiante
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type GroupMemberSummary, type GroupSummary, type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import { type IReservationClock } from "@/features/reservations/application/ports/reservation-clock.interface";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { CancelReservationUseCase } from "@/features/reservations/application/use-cases/cancel-reservation.usecase";
import { CreateReservationUseCase } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { ReleaseActiveReservationUseCase } from "@/features/reservations/application/use-cases/release-active-reservation.usecase";
import { ReserveNowUseCase } from "@/features/reservations/application/use-cases/reserve-now.usecase";
import { Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationAnalyticsRepository } from "@/features/reservations/domain/repositories/reservation-analytics.repository";
import {
  type IReservationsRepository,
  type ReservationRangeQuery,
  type ReservationsOfUserQuery,
} from "@/features/reservations/domain/repositories/reservations.repository";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export const NOW: Date = new Date("2026-10-12T10:05:00.000Z");

export const TEST_SETTINGS: ReservationSettings = {
  maxDurationMinutes: 120,
  slotMinutes: 15,
  maxAdvanceDays: 14,
  maxUpcomingPerStudent: 3,
  maxUpcomingPerGroup: 5,
  deviceId: "ventilab-device-001",
};

export function at(time: string): Date {
  return new Date(`2026-10-12T${time}:00.000Z`);
}

export class AsyncMutex {
  private _tail: Promise<void> = Promise.resolve();

  public acquire(): Promise<() => void> {
    let release: () => void = (): void => undefined;

    const next: Promise<void> = new Promise<void>((resolve: () => void): void => {
      release = resolve;
    });

    const previous: Promise<void> = this._tail;

    this._tail = previous.then((): Promise<void> => next);

    return previous.then((): (() => void) => release);
  }
}

interface InMemoryTransaction {
  releases: (() => void)[];
}

export class InMemoryTransactionManager implements ITransactionManager {
  public async run<T>(work: (transaction: unknown) => Promise<T>): Promise<T> {
    const transaction: InMemoryTransaction = { releases: [] };

    try {
      return await work(transaction);
    } finally {
      transaction.releases.forEach((release: () => void): void => release());
    }
  }
}

export class InMemoryReservationsRepository implements IReservationsRepository {
  public readonly rows: Map<string, Reservation> = new Map<string, Reservation>();
  public readonly mutex: AsyncMutex = new AsyncMutex();
  public lockedDevices: string[] = [];

  public async lockDevice(deviceId: string, transaction: unknown): Promise<void> {
    const release: () => void = await this.mutex.acquire();

    this.lockedDevices.push(deviceId);
    (transaction as InMemoryTransaction).releases.push(release);
  }

  public async getById(id: string): Promise<Reservation | undefined> {
    return await Promise.resolve(this.rows.get(id));
  }

  public async getScheduledOverlapping(window: ReservationWindow): Promise<Reservation[]> {
    return await Promise.resolve(this._all().filter((reservation: Reservation): boolean => reservation.isScheduled() && reservation.window.overlaps(window)));
  }

  public async getActiveAt(now: Date): Promise<Reservation | undefined> {
    return await Promise.resolve(this._all().find((reservation: Reservation): boolean => reservation.isActiveAt(now)));
  }

  public async getInRange(query: ReservationRangeQuery): Promise<Reservation[]> {
    return await Promise.resolve(
      this._all().filter(
        (reservation: Reservation): boolean =>
          reservation.startsAt.getTime() < query.to.getTime() &&
          reservation.endsAt.getTime() > query.from.getTime() &&
          (query.groupId === undefined || reservation.holder.groupId === query.groupId),
      ),
    );
  }

  public async getOfUser(query: ReservationsOfUserQuery): Promise<Reservation[]> {
    return await Promise.resolve(
      this._all().filter(
        (reservation: Reservation): boolean =>
          reservation.endsAt.getTime() > query.endsAfter.getTime() &&
          (reservation.holder.userId === query.userId ||
            reservation.createdById === query.userId ||
            (reservation.holder.groupId !== undefined && query.groupIds.includes(reservation.holder.groupId))),
      ),
    );
  }

  public async countUpcomingScheduledOfUser(userId: string, now: Date): Promise<number> {
    return await Promise.resolve(
      this._all().filter(
        (reservation: Reservation): boolean =>
          reservation.isScheduled() && reservation.endsAt.getTime() > now.getTime() && (reservation.holder.userId === userId || reservation.createdById === userId),
      ).length,
    );
  }

  public async countUpcomingScheduledOfGroup(groupId: string, now: Date): Promise<number> {
    return await Promise.resolve(
      this._all().filter(
        (reservation: Reservation): boolean => reservation.isScheduled() && reservation.endsAt.getTime() > now.getTime() && reservation.holder.groupId === groupId,
      ).length,
    );
  }

  public async save(reservation: Reservation): Promise<void> {
    await Promise.resolve();

    this.rows.set(reservation.id, reservation);
  }

  private _all(): Reservation[] {
    return [...this.rows.values()].sort((a: Reservation, b: Reservation): number => a.startsAt.getTime() - b.startsAt.getTime());
  }
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  studentCode?: string;
}

export const USERS: readonly TestUser[] = [
  { id: "student-1", name: "Ana Student", email: "ana@example.com", role: "STUDENT", studentCode: "2024000001" },
  { id: "student-2", name: "Bruno Member", email: "bruno@example.com", role: "STUDENT" },
  { id: "leader-1", name: "Lucia Leader", email: "lucia@example.com", role: "STUDENT", studentCode: "2024000003" },
  { id: "teacher-1", name: "Tomas Teacher", email: "tomas@example.com", role: "TEACHER" },
  { id: "teacher-2", name: "Teresa Teacher", email: "teresa@example.com", role: "TEACHER" },
  { id: "admin-1", name: "Adriana Admin", email: "adriana@example.com", role: "ADMIN" },
];

export const GROUPS: readonly GroupSummary[] = [
  { id: "group-1", name: "Group A", type: "STUDENT", isActive: true },
  { id: "group-2", name: "Group B", type: "STUDENT", isActive: true },
  { id: "group-t", name: "Teachers", type: "TEACHER", isActive: true },
];

interface TestMember {
  groupId: string;
  userId: string;
  memberRole: "LEADER" | "MEMBER";
}

const MEMBERS: readonly TestMember[] = [
  { groupId: "group-1", userId: "leader-1", memberRole: "LEADER" },
  { groupId: "group-1", userId: "student-2", memberRole: "MEMBER" },
];

const SUPERVISED: Readonly<Record<string, string[]>> = { "teacher-1": ["group-1"] };

function toAccount(user: TestUser): UserAccount {
  return { id: user.id, email: user.email, name: user.name, role: user.role, isActive: true, hasPassword: true, createdAt: NOW, studentCode: user.studentCode };
}

export function buildUsersFacade(): UsersFacade {
  const facade: Pick<UsersFacade, "getUserById" | "getUsersByIds"> = {
    getUserById: (id: string): Promise<UserAccount | undefined> => {
      const user: TestUser | undefined = USERS.find((candidate: TestUser): boolean => candidate.id === id);

      return Promise.resolve(user ? toAccount(user) : undefined);
    },
    getUsersByIds: (ids: readonly string[]): Promise<UserAccount[]> =>
      Promise.resolve(USERS.filter((user: TestUser): boolean => ids.includes(user.id)).map(toAccount)),
  };

  return facade as unknown as UsersFacade;
}

export const EMPTY_RESERVATION_ANALYTICS: IReservationAnalyticsRepository = {
  getUserHeldReservations: (): Promise<[]> => Promise.resolve([]),
  getReservationActivityOfUser: (): Promise<[]> => Promise.resolve([]),
};

export function buildGroupsFacade(): GroupsFacade {
  const facade: Pick<
    GroupsFacade,
    "getGroupSummary" | "isGroupLeader" | "isMemberOf" | "getSupervisedStudentGroupIds" | "getStudentGroupOfUser" | "getGroupMembers" | "canManageGroup"
  > = {
    getGroupSummary: (groupId: string): Promise<GroupSummary | undefined> =>
      Promise.resolve(GROUPS.find((group: GroupSummary): boolean => group.id === groupId)),
    isGroupLeader: (userId: string, groupId: string): Promise<boolean> =>
      Promise.resolve(MEMBERS.some((member: TestMember): boolean => member.userId === userId && member.groupId === groupId && member.memberRole === "LEADER")),
    isMemberOf: (userId: string, groupId: string): Promise<boolean> =>
      Promise.resolve(MEMBERS.some((member: TestMember): boolean => member.userId === userId && member.groupId === groupId)),
    getSupervisedStudentGroupIds: (teacherUserId: string): Promise<string[]> => Promise.resolve(SUPERVISED[teacherUserId] ?? []),
    canManageGroup: (user: { id: string }, groupId: string): Promise<boolean> => Promise.resolve((SUPERVISED[user.id] ?? []).includes(groupId)),
    getStudentGroupOfUser: (userId: string): Promise<StudentGroupSummaryView | undefined> => {
      const membership: TestMember | undefined = MEMBERS.find((member: TestMember): boolean => member.userId === userId);

      return Promise.resolve(membership ? { id: membership.groupId, name: "Group A", members: [], supervisingGroups: [] } : undefined);
    },
    getGroupMembers: (groupId: string): Promise<GroupMemberSummary[]> =>
      Promise.resolve(
        MEMBERS.filter((member: TestMember): boolean => member.groupId === groupId).map(
          (member: TestMember): GroupMemberSummary => ({ userId: member.userId, email: `${member.userId}@example.com`, userRole: "STUDENT", memberRole: member.memberRole }),
        ),
      ),
  };

  return facade as unknown as GroupsFacade;
}

export class RecordingEventBus implements IEventBus {
  public readonly published: DomainEvent[] = [];

  public publish(events: DomainEvent[]): void {
    this.published.push(...events);
  }
}

export interface AuditEntry {
  actorId?: string;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  transaction?: unknown;
}

export class RecordingAuditRecorder implements IAuditRecorder {
  public readonly entries: AuditEntry[] = [];

  public record(
    actorId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    transaction?: unknown,
  ): Promise<void> {
    this.entries.push({ actorId, action, targetType, targetId, before, after, transaction });

    return Promise.resolve();
  }
}

export interface ReservationsTestContext {
  repository: InMemoryReservationsRepository;
  eventBus: RecordingEventBus;
  auditRecorder: RecordingAuditRecorder;
  clock: IReservationClock;
  accessService: ReservationAccessService;
  viewsService: ReservationViewsService;
  createUseCase: CreateReservationUseCase;
  cancelUseCase: CancelReservationUseCase;
  reserveNowUseCase: ReserveNowUseCase;
  releaseUseCase: ReleaseActiveReservationUseCase;
}

export function buildContext(now: Date = NOW, settings: ReservationSettings = TEST_SETTINGS): ReservationsTestContext {
  const repository: InMemoryReservationsRepository = new InMemoryReservationsRepository();
  const transactionManager: InMemoryTransactionManager = new InMemoryTransactionManager();
  const eventBus: RecordingEventBus = new RecordingEventBus();
  const auditRecorder: RecordingAuditRecorder = new RecordingAuditRecorder();
  const clock: IReservationClock = { now: (): Date => new Date(now.getTime()) };
  const usersFacade: UsersFacade = buildUsersFacade();
  const groupsFacade: GroupsFacade = buildGroupsFacade();
  const accessService: ReservationAccessService = new ReservationAccessService(groupsFacade);
  const viewsService: ReservationViewsService = new ReservationViewsService(usersFacade, groupsFacade);

  return {
    repository,
    eventBus,
    auditRecorder,
    clock,
    accessService,
    viewsService,
    createUseCase: new CreateReservationUseCase(repository, transactionManager, eventBus, auditRecorder, settings, clock, accessService, viewsService, usersFacade),
    cancelUseCase: new CancelReservationUseCase(repository, transactionManager, eventBus, settings, clock, accessService),
    reserveNowUseCase: new ReserveNowUseCase(repository, transactionManager, eventBus, settings, clock, accessService, usersFacade),
    releaseUseCase: new ReleaseActiveReservationUseCase(repository, transactionManager, eventBus, settings, clock, accessService),
  };
}

export async function seedReservation(
  repository: InMemoryReservationsRepository,
  {
    holder,
    createdById,
    startsAt,
    endsAt,
  }: {
    holder: ReservationHolder;
    createdById: string;
    startsAt: Date;
    endsAt: Date;
  },
): Promise<Reservation> {
  const reservation: Reservation = Reservation.schedule({ holder, window: ReservationWindow.create(startsAt, endsAt), createdById, now: NOW });

  reservation.getEvents();

  await repository.save(reservation);

  return reservation;
}
