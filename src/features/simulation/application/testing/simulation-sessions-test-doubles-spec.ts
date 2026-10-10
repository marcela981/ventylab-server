/*
 * Funcionalidad: Dobles de prueba de las sesiones de simulación
 * Descripción: Repositorio en memoria de sesiones y eventos, lector de intentos de examen falso, fachadas de casos clínicos y grupos falsas, generador de semillas fijo, gestor de transacciones inmediato, ajustes por defecto y un caso clínico de pulmón normal listo para el motor, compartidos por las pruebas de los casos de uso de sesiones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { type ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { ClinicalCaseNotFoundError, ClinicalCaseUnavailableError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import {
  type ClinicalCaseSnapshot,
  type SimulationReadyClinicalCase,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import {
  type ExamAttemptInfo,
  type ExamQuestionInfo,
  type IExamAttemptReader,
} from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import { type ISimulationSeedGenerator } from "@/features/simulation/application/ports/simulation-seed-generator.interface";
import { SimulationSessionAccessService } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionReader } from "@/features/simulation/application/services/simulation-session-reader.service";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionStatusCount,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type GetSimulationSessionsQuery,
  type ISimulationSessionsRepository,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { SIMULATION_SESSION_STATUS_VALUES } from "@/features/simulation/domain/value-objects/simulation-session-values";

export const TEST_TRANSACTION: object = { kind: "transaction" };

export const TEST_SEED: number = 4242;

export const TEST_SETTINGS: SimulationSessionSettings = { eventTimeToleranceMs: 5000, abandonAfterMs: 30 * 60_000, maxEventBatchSize: 200 };

export class InMemorySimulationSessionsRepository implements ISimulationSessionsRepository {
  public readonly sessions: Map<string, SimulationSession> = new Map<string, SimulationSession>();
  public readonly events: SimulationEventRecord[] = [];
  public readonly lockedIds: string[] = [];

  public getById(id: string): Promise<SimulationSession | undefined> {
    return Promise.resolve(this.sessions.get(id));
  }

  public getByIdForUpdate(id: string): Promise<SimulationSession | undefined> {
    this.lockedIds.push(id);

    return Promise.resolve(this.sessions.get(id));
  }

  public save(session: SimulationSession): Promise<void> {
    this.sessions.set(session.id, session);

    return Promise.resolve();
  }

  public getEvents(sessionId: string): Promise<SimulationEventRecord[]> {
    return Promise.resolve(this._eventsSorted(sessionId));
  }

  private _eventsSorted(sessionId: string): SimulationEventRecord[] {
    return this.events
      .filter((event: SimulationEventRecord): boolean => event.sessionId === sessionId)
      .sort((a: SimulationEventRecord, b: SimulationEventRecord): number => a.simTimeMs - b.simTimeMs || a.receivedAt.getTime() - b.receivedAt.getTime());
  }

  public getEventSessionIds(eventIds: readonly string[]): Promise<Map<string, string>> {
    return Promise.resolve(
      new Map<string, string>(
        this.events
          .filter((event: SimulationEventRecord): boolean => eventIds.includes(event.id))
          .map((event: SimulationEventRecord): [string, string] => [event.id, event.sessionId]),
      ),
    );
  }

  public insertEvents(events: readonly SimulationEventRecord[]): Promise<void> {
    this.events.push(...events);

    return Promise.resolve();
  }

  public getAll(query: GetSimulationSessionsQuery): Promise<Paginated<SimulationSession>> {
    const items: SimulationSession[] = [...this.sessions.values()].filter(
      (session: SimulationSession): boolean =>
        session.userId === query.userId &&
        (query.caseId === undefined || session.caseId === query.caseId) &&
        (query.mode === undefined || session.mode === query.mode) &&
        (query.status === undefined || session.status === query.status),
    );

    return Promise.resolve(
      new Paginated<SimulationSession>({
        items: items.slice((query.page - 1) * query.limit, query.page * query.limit),
        total: items.length,
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  public countByStatusForUsers(userIds: readonly string[]): Promise<SimulationSessionStatusCount[]> {
    const sessions: SimulationSession[] = [...this.sessions.values()].filter((session: SimulationSession): boolean => userIds.includes(session.userId));
    const rows: SimulationSessionStatusCount[] = SIMULATION_SESSION_STATUS_VALUES.map((status: SimulationSessionStatusCount["status"]): SimulationSessionStatusCount => {
      const matching: SimulationSession[] = sessions.filter((session: SimulationSession): boolean => session.status === status);
      const scores: number[] = matching
        .map((session: SimulationSession): number | undefined => session.summary?.score)
        .filter((score: number | undefined): score is number => score !== undefined);

      return {
        status,
        count: matching.length,
        scoredCount: scores.length,
        averageScore: scores.length > 0 ? scores.reduce((sum: number, score: number): number => sum + score, 0) / scores.length : null,
      };
    });

    return Promise.resolve(rows.filter((row: SimulationSessionStatusCount): boolean => row.count > 0));
  }

  public eventsOf(sessionId: string): SimulationEventRecord[] {
    return this.events.filter((event: SimulationEventRecord): boolean => event.sessionId === sessionId);
  }
}

export class FakeExamAttemptReader implements IExamAttemptReader {
  public readonly attempts: Map<string, ExamAttemptInfo> = new Map<string, ExamAttemptInfo>();
  public readonly questions: Map<string, ExamQuestionInfo> = new Map<string, ExamQuestionInfo>();

  public getAttempt(attemptId: string): Promise<ExamAttemptInfo | undefined> {
    return Promise.resolve(this.attempts.get(attemptId));
  }

  public getQuestion(questionId: string): Promise<ExamQuestionInfo | undefined> {
    return Promise.resolve(this.questions.get(questionId));
  }
}

export class FakeClinicalCasesFacade {
  public readonly cases: Map<string, ClinicalCaseSnapshot> = new Map<string, ClinicalCaseSnapshot>();

  public getCaseById(id: string): Promise<ClinicalCaseSnapshot | undefined> {
    return Promise.resolve(this.cases.get(id));
  }

  public getPublishedCaseForSimulation(id: string): Promise<SimulationReadyClinicalCase> {
    const snapshot: ClinicalCaseSnapshot | undefined = this.cases.get(id);

    if (!snapshot) {
      return Promise.reject(new ClinicalCaseNotFoundError());
    }

    if (snapshot.status !== "PUBLISHED") {
      return Promise.reject(new ClinicalCaseUnavailableError());
    }

    return Promise.resolve({} as SimulationReadyClinicalCase);
  }

  public asFacade(): ClinicalCasesFacade {
    return this as unknown as ClinicalCasesFacade;
  }
}

export class FakeGroupsFacade {
  public readonly studentGroups: Map<string, string> = new Map<string, string>();
  public readonly managers: Set<string> = new Set<string>();
  public readonly members: Map<string, string[]> = new Map<string, string[]>();

  public getStudentGroupOfUser(userId: string): Promise<{ id: string } | undefined> {
    const groupId: string | undefined = this.studentGroups.get(userId);

    return Promise.resolve(groupId === undefined ? undefined : { id: groupId });
  }

  public canManageGroup(actor: { id: string }, groupId: string): Promise<boolean> {
    return Promise.resolve(this.managers.has(`${actor.id}:${groupId}`));
  }

  public getGroupMembers(groupId: string): Promise<{ userId: string }[]> {
    return Promise.resolve((this.members.get(groupId) ?? []).map((userId: string): { userId: string } => ({ userId })));
  }

  public asFacade(): GroupsFacade {
    return this as unknown as GroupsFacade;
  }
}

export class FixedSeedGenerator implements ISimulationSeedGenerator {
  public next(): number {
    return TEST_SEED;
  }
}

export function immediateTransactionManager(): ITransactionManager {
  return { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TEST_TRANSACTION) };
}

export function normalLungSnapshot(overrides: Partial<ClinicalCaseSnapshot> = {}): ClinicalCaseSnapshot {
  return {
    id: "case-normal",
    title: "Normal lung",
    status: "PUBLISHED",
    validatedByExpert: false,
    difficulty: "BEGINNER",
    pathology: "NORMAL",
    patientAge: 45,
    patientWeightKg: 75,
    simulationReady: true,
    simulation: {
      patientSex: "MALE",
      patientHeightCm: 175,
      mechanics: {
        complianceMlPerCmH2O: 60,
        resistanceCmH2OPerLps: 8,
        deadSpaceMl: 150,
        vco2MlPerMin: 200,
        bicarbonateMmolPerL: 24,
        hemoglobinGPerDl: 14,
        arteriovenousO2DifferenceMlPerDl: 5,
        basalShuntFraction: 0.05,
        recruitmentCurve: [],
        patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
        hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
        gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
        deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
      },
      initialVentilatorSettings: { mode: "VCV", tidalVolumeMl: 500, respiratoryRateBpm: 12, peepCmH2O: 5, fio2: 0.4, inspiratoryTimeS: 1 },
      initialState: { paco2MmHg: 40, pao2MmHg: 95 },
      events: [],
      targets: { spo2Percent: { min: 94, max: 98 }, paco2MmHg: { min: 35, max: 45 }, plateauPressureMaxCmH2O: 30 },
    },
    ...overrides,
  };
}

export interface SimulationTestContext {
  readonly repository: InMemorySimulationSessionsRepository;
  readonly examReader: FakeExamAttemptReader;
  readonly clinicalCases: FakeClinicalCasesFacade;
  readonly groups: FakeGroupsFacade;
  readonly transactionManager: ITransactionManager;
  readonly runtime: SimulationSessionRuntime;
  readonly accessService: SimulationSessionAccessService;
  readonly reader: SimulationSessionReader;
}

export function createSimulationTestContext(settings: SimulationSessionSettings = TEST_SETTINGS): SimulationTestContext {
  const repository: InMemorySimulationSessionsRepository = new InMemorySimulationSessionsRepository();
  const examReader: FakeExamAttemptReader = new FakeExamAttemptReader();
  const clinicalCases: FakeClinicalCasesFacade = new FakeClinicalCasesFacade();
  const groups: FakeGroupsFacade = new FakeGroupsFacade();
  const transactionManager: ITransactionManager = immediateTransactionManager();
  const runtime: SimulationSessionRuntime = new SimulationSessionRuntime(repository, examReader, transactionManager, settings, clinicalCases.asFacade());
  const accessService: SimulationSessionAccessService = new SimulationSessionAccessService(groups.asFacade());
  const reader: SimulationSessionReader = new SimulationSessionReader(runtime, accessService);

  clinicalCases.cases.set("case-normal", normalLungSnapshot());

  return { repository, examReader, clinicalCases, groups, transactionManager, runtime, accessService, reader };
}

export function useFixedClock(now: Date): void {
  jest.useFakeTimers({ now, doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
}

export async function storeSession(
  context: SimulationTestContext,
  overrides: Partial<Parameters<typeof SimulationSession.start>[0]> = {},
): Promise<SimulationSession> {
  const session: SimulationSession = SimulationSession.start({
    userId: "student-1",
    caseId: "case-normal",
    mode: "FREE",
    seed: TEST_SEED,
    engineVersion: "1.0.0",
    timeMultiplier: 1,
    now: new Date(),
    ...overrides,
  });

  await context.repository.save(session);

  return session;
}
