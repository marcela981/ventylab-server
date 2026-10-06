/*
 * Funcionalidad: Dobles de prueba de intentos de evaluación
 * Descripción: Repositorio de intentos en memoria con transacciones simuladas (cambios preparados que se confirman al terminar sin error) y candados por nombre serializados con un mutex que se libera al cerrar la transacción, como pg_advisory_xact_lock; más evaluaciones, asignaciones, alcance de grupos, proveedor de puntaje práctico y propietario de sesiones simulados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type IPracticalScoreProvider, type PracticalScoreResult } from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { type ISimulationSessionOwnership } from "@/features/evaluation/application/ports/simulation-session-ownership.interface";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { StudentAnswerRecorder } from "@/features/evaluation/application/services/student-answer-recorder";
import { EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  StudentEvaluationAttempt,
  type StudentEvaluationAttemptProps,
} from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";
import { type IEvaluationAssignmentsRepository } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type AttemptCounters,
  type IStudentEvaluationAttemptsRepository,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";

export const STUDENT_ID: string = "student-1";
export const GROUP_ID: string = "group-1";
export const MINUTE: number = 60 * 1000;

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * MINUTE);
}

const PROMPT: Record<string, unknown> = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Pick the right setting" }] }] };

export function attemptQuestion(id: string, type: EvaluationQuestionTypeValue = "SINGLE_CHOICE", points: number = 1): EvaluationQuestionItem {
  const hasOptions: boolean = type === "SINGLE_CHOICE" || type === "TRUE_FALSE" || type === "MULTIPLE_CHOICE";

  return {
    id,
    evaluationId: "evaluation-1",
    order: Number(id.replace(/\D/g, "")) || 0,
    type,
    prompt: PROMPT,
    mediaIds: [],
    points,
    explanation: "Because the guideline says so",
    rubric: type === "SIMULATION" || type === "OPEN_TEXT" ? { criteria: "expert" } : undefined,
    clinicalCaseId: type === "SIMULATION" ? "case-1" : undefined,
    options: hasOptions
      ? [
        { id: `${id}-ok`, questionId: id, order: 0, content: "Right", isCorrect: true, legacyFeedback: "Well done" },
        { id: `${id}-ko`, questionId: id, order: 1, content: "Wrong", isCorrect: false },
      ]
      : [],
  };
}

export function buildAttemptEvaluation({
  questions = [attemptQuestion("q1"), attemptQuestion("q2")],
  durationMinutes,
  maxAttempts = 1,
  showResultsImmediately = true,
  shuffleQuestions = false,
  status = "READY",
}: {
  questions?: EvaluationQuestionItem[];
  durationMinutes?: number;
  maxAttempts?: number;
  showResultsImmediately?: boolean;
  shuffleQuestions?: boolean;
  status?: "DRAFT" | "READY" | "ARCHIVED";
} = {}): Evaluation {
  return Evaluation.reconstitute({
    id: "evaluation-1",
    type: "QUIZ",
    title: "Ventilation basics",
    description: "Answer every question",
    durationMinutes,
    maxAttempts,
    shuffleQuestions,
    showResultsImmediately,
    status,
    order: 0,
    createdById: "teacher-1",
    legacy: {},
    createdAt: minutesFromNow(-600),
    updatedAt: minutesFromNow(-600),
    scenarios: [],
    questions,
    auditLogs: [],
  });
}

export function buildAttemptAssignment({ startsAt = minutesFromNow(-60), endsAt = minutesFromNow(60), groupId = GROUP_ID }: { startsAt?: Date; endsAt?: Date; groupId?: string } = {}): EvaluationAssignment {
  return EvaluationAssignment.reconstitute({
    id: "assignment-1",
    evaluationId: "evaluation-1",
    groupId,
    startsAt,
    endsAt,
    createdAt: minutesFromNow(-600),
    updatedAt: minutesFromNow(-600),
  });
}

export function buildStoredAttempt(overrides: Partial<StudentEvaluationAttemptProps> = {}): StudentEvaluationAttempt {
  return StudentEvaluationAttempt.reconstitute({
    id: "attempt-1",
    evaluationId: "evaluation-1",
    assignmentId: "assignment-1",
    userId: STUDENT_ID,
    attemptNumber: 1,
    status: "IN_PROGRESS",
    startedAt: minutesFromNow(-10),
    deadlineAt: minutesFromNow(20),
    isLate: false,
    answers: [],
    createdAt: minutesFromNow(-10),
    updatedAt: minutesFromNow(-10),
    ...overrides,
  });
}

class KeyedMutex {
  private readonly _tails: Map<string, Promise<void>> = new Map<string, Promise<void>>();

  public async acquire(key: string): Promise<() => void> {
    const previous: Promise<void> = this._tails.get(key) ?? Promise.resolve();
    let release: () => void = (): void => undefined;
    const current: Promise<void> = new Promise<void>((resolve: () => void) => {
      release = resolve;
    });

    this._tails.set(key, previous.then(() => current));

    await previous;

    return release;
  }
}

interface FakeTransaction {
  readonly staged: Map<string, StudentEvaluationAttemptProps>;
  readonly releases: Array<() => void>;
}

function asTransaction(transaction: unknown): FakeTransaction | undefined {
  return typeof transaction === "object" && transaction !== null && "staged" in transaction ? (transaction as FakeTransaction) : undefined;
}

export class InMemoryAttemptsRepository implements IStudentEvaluationAttemptsRepository {
  public readonly store: Map<string, StudentEvaluationAttemptProps> = new Map<string, StudentEvaluationAttemptProps>();
  public readonly locks: string[] = [];
  public readonly sharedLocks: string[] = [];
  public readonly briefs: StudentEvaluationBriefView[] = [];
  private readonly _mutex: KeyedMutex = new KeyedMutex();

  public constructor(attempts: StudentEvaluationAttempt[] = []) {
    for (const attempt of attempts) {
      this.store.set(attempt.id, attempt.toSnapshot());
    }
  }

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    this.locks.push(key);
    await this._lock(key, transaction);
  }

  public async acquireSharedTransactionLock(key: string, transaction: unknown): Promise<void> {
    this.sharedLocks.push(key);
    await this._lock(`shared:${key}`, transaction);
  }

  public async getById(id: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined> {
    await Promise.resolve();

    const props: StudentEvaluationAttemptProps | undefined = this._all(transaction).find((item: StudentEvaluationAttemptProps) => item.id === id);

    return props ? StudentEvaluationAttempt.reconstitute(structuredClone(props)) : undefined;
  }

  public async getInProgress(evaluationId: string, userId: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined> {
    await Promise.resolve();

    const props: StudentEvaluationAttemptProps | undefined = this._all(transaction).find(
      (item: StudentEvaluationAttemptProps) =>
        item.evaluationId === evaluationId && item.userId === userId && item.status === "IN_PROGRESS" && item.legacySource === undefined,
    );

    return props ? StudentEvaluationAttempt.reconstitute(structuredClone(props)) : undefined;
  }

  public async getAttemptCounters(evaluationId: string, userId: string, transaction?: unknown): Promise<AttemptCounters> {
    await Promise.resolve();

    const own: StudentEvaluationAttemptProps[] = this._all(transaction).filter(
      (item: StudentEvaluationAttemptProps) => item.evaluationId === evaluationId && item.userId === userId,
    );

    return { count: own.length, maxAttemptNumber: Math.max(0, ...own.map((item: StudentEvaluationAttemptProps) => item.attemptNumber)) };
  }

  public async getInProgressByUser(userId: string): Promise<StudentEvaluationAttempt[]> {
    await Promise.resolve();

    return this._all(undefined)
      .filter((item: StudentEvaluationAttemptProps) => item.userId === userId && item.status === "IN_PROGRESS" && item.legacySource === undefined)
      .map((item: StudentEvaluationAttemptProps) => StudentEvaluationAttempt.reconstitute(structuredClone(item)));
  }

  public async getUserAttemptSummaries(userId: string, evaluationIds: ReadonlyArray<string>): Promise<StudentAttemptSummaryView[]> {
    await Promise.resolve();

    return this._all(undefined)
      .filter((item: StudentEvaluationAttemptProps) => item.userId === userId && evaluationIds.includes(item.evaluationId))
      .map((item: StudentEvaluationAttemptProps) => ({
        id: item.id,
        evaluationId: item.evaluationId,
        assignmentId: item.assignmentId,
        attemptNumber: item.attemptNumber,
        status: item.status,
        startedAt: item.startedAt,
        submittedAt: item.submittedAt,
        deadlineAt: item.deadlineAt,
        score: item.score,
        maxScore: item.maxScore,
        grade: item.grade,
        gradePublishedAt: item.gradePublishedAt,
      }));
  }

  public async getStudentEvaluationBriefs(evaluationIds: ReadonlyArray<string>): Promise<StudentEvaluationBriefView[]> {
    await Promise.resolve();

    return this.briefs.filter((brief: StudentEvaluationBriefView) => evaluationIds.includes(brief.id));
  }

  public async save(attempt: StudentEvaluationAttempt, transaction?: unknown): Promise<void> {
    await Promise.resolve();

    const fake: FakeTransaction | undefined = asTransaction(transaction);
    const snapshot: StudentEvaluationAttemptProps = structuredClone(attempt.toSnapshot());

    if (fake) {
      fake.staged.set(attempt.id, snapshot);
    } else {
      this.store.set(attempt.id, snapshot);
    }
  }

  public commit(transaction: FakeTransaction): void {
    for (const [id, props] of transaction.staged) {
      this.store.set(id, props);
    }
  }

  public attempts(): StudentEvaluationAttemptProps[] {
    return [...this.store.values()];
  }

  private async _lock(key: string, transaction: unknown): Promise<void> {
    const release: () => void = await this._mutex.acquire(key);

    asTransaction(transaction)?.releases.push(release);
  }

  private _all(transaction: unknown): StudentEvaluationAttemptProps[] {
    const merged: Map<string, StudentEvaluationAttemptProps> = new Map<string, StudentEvaluationAttemptProps>(this.store);

    for (const [id, props] of asTransaction(transaction)?.staged ?? []) {
      merged.set(id, props);
    }

    return [...merged.values()];
  }
}

export interface AttemptState {
  evaluation?: Evaluation;
  assignment?: EvaluationAssignment;
  studentGroupId?: string | null;
  attempts?: StudentEvaluationAttempt[];
  practicalScore?: PracticalScoreResult;
  sessionOwnerId?: string;
  passingGrade?: number;
}

export interface AttemptDoubles {
  attemptsRepository: InMemoryAttemptsRepository;
  evaluationsRepository: IEvaluationsRepository;
  assignmentsRepository: IEvaluationAssignmentsRepository;
  transactionManager: ITransactionManager;
  eventBus: IEventBus;
  access: EvaluationAssignmentAccess;
  closer: EvaluationAttemptCloser;
  recorder: StudentAnswerRecorder;
  gradingConfig: EvaluationGradingConfig;
  publish: jest.Mock;
  getSessionScore: jest.Mock;
  getSessionOwnerId: jest.Mock;
}

export function buildAttemptDoubles(state: AttemptState = {}): AttemptDoubles {
  const evaluation: Evaluation = state.evaluation ?? buildAttemptEvaluation();
  const assignment: EvaluationAssignment = state.assignment ?? buildAttemptAssignment();
  const attemptsRepository: InMemoryAttemptsRepository = new InMemoryAttemptsRepository(state.attempts ?? []);
  const publish: jest.Mock = jest.fn();
  const getSessionScore: jest.Mock = jest.fn().mockResolvedValue(state.practicalScore ?? { available: false, reason: "SESSION_NOT_FOUND" });
  const getSessionOwnerId: jest.Mock = jest.fn().mockResolvedValue(state.sessionOwnerId ?? STUDENT_ID);
  const gradingConfig: EvaluationGradingConfig = { passingGrade: state.passingGrade ?? 3 };

  const evaluationsRepository: IEvaluationsRepository = {
    getById: jest.fn().mockImplementation((id: string) => Promise.resolve(id === evaluation.id ? evaluation : undefined)),
    getSummaries: jest.fn(),
    getUsage: jest.fn(),
    findMissingMediaIds: jest.fn(),
    findMissingReferences: jest.fn(),
    acquireTransactionLock: jest.fn().mockResolvedValue(undefined),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const assignmentsRepository: IEvaluationAssignmentsRepository = {
    getById: jest.fn().mockImplementation((id: string) => Promise.resolve(id === assignment.id ? assignment : undefined)),
    getByEvaluationAndGroups: jest.fn(),
    getGroupTargets: jest.fn(),
    countAttempts: jest.fn(),
    getViews: jest.fn(),
    getViewsByEvaluation: jest.fn(),
    getStudentGroupViews: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const studentGroupId: string | null = state.studentGroupId === undefined ? GROUP_ID : state.studentGroupId;

  const groupsFacade: GroupsFacade = {
    getStudentGroupOfUser: jest.fn().mockResolvedValue(studentGroupId === null ? undefined : { id: studentGroupId, name: "Group", members: [], supervisingGroups: [] }),
  } as unknown as GroupsFacade;

  const transactionManager: ITransactionManager = {
    run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => {
      const transaction: FakeTransaction = { staged: new Map<string, StudentEvaluationAttemptProps>(), releases: [] };

      try {
        const result: T = await work(transaction);

        attemptsRepository.commit(transaction);

        return result;
      } finally {
        transaction.releases.forEach((release: () => void) => release());
      }
    },
  };

  const eventBus: IEventBus = { publish };
  const practicalScoreProvider: IPracticalScoreProvider = { getSessionScore };
  const sessionOwnership: ISimulationSessionOwnership = { getSessionOwnerId };

  return {
    attemptsRepository,
    evaluationsRepository,
    assignmentsRepository,
    transactionManager,
    eventBus,
    access: new EvaluationAssignmentAccess(groupsFacade),
    closer: new EvaluationAttemptCloser(
      attemptsRepository,
      evaluationsRepository,
      assignmentsRepository,
      practicalScoreProvider,
      gradingConfig,
      transactionManager,
      eventBus,
    ),
    recorder: new StudentAnswerRecorder(sessionOwnership),
    gradingConfig,
    publish,
    getSessionScore,
    getSessionOwnerId,
  };
}

export function publishedEvents<T extends DomainEvent>(doubles: AttemptDoubles, eventClass: abstract new (...args: never[]) => T): T[] {
  return doubles.publish.mock.calls.flatMap((call: unknown[]) => (call[0] as DomainEvent[]).filter((event: DomainEvent): event is T => event instanceof eventClass));
}
