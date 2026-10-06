/*
 * Funcionalidad: Dobles de prueba de la calificación docente de evaluaciones
 * Descripción: Repositorio de calificación en memoria sobre el repositorio de intentos en memoria (cola PENDING_REVIEW, intentos vencidos en curso, intentos publicables y alcance del profesor por conjunto de intentos permitidos), registrador de auditoría simulado, acceso de calificación y actores profesor y administrador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { type EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import {
  type AttemptDoubles,
  type AttemptState,
  buildAttemptDoubles,
  type InMemoryAttemptsRepository,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { type StudentEvaluationAttemptProps } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  type GetGradingQueueQuery,
  type GradingAttemptFilter,
  type GradingAttemptKey,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export const TEACHER: EvaluationActor = { id: "teacher-1", role: "TEACHER" };
export const ADMIN: EvaluationActor = { id: "admin-1", role: "ADMIN" };

export class InMemoryGradingRepository implements IEvaluationGradingRepository {
  public readonly scopedAttemptIds: Set<string>;
  public readonly getPublishedGradesOfUser: jest.Mock = jest.fn().mockResolvedValue([]);
  public readonly getPublishedGradesOfGroup: jest.Mock = jest.fn().mockResolvedValue([]);
  public readonly getEvaluationStats: jest.Mock = jest.fn();
  public readonly countPendingReview: jest.Mock = jest.fn().mockResolvedValue(0);

  public constructor(
    private readonly _attempts: InMemoryAttemptsRepository,
    scopedAttemptIds: ReadonlyArray<string>,
  ) {
    this.scopedAttemptIds = new Set<string>(scopedAttemptIds);
  }

  public async getQueue(query: GetGradingQueueQuery): Promise<Paginated<GradingQueueItemView>> {
    await Promise.resolve();

    const items: GradingQueueItemView[] = this._matching(query)
      .filter((item: StudentEvaluationAttemptProps) => item.status === "PENDING_REVIEW")
      .map((item: StudentEvaluationAttemptProps) => ({
        attemptId: item.id,
        evaluationId: item.evaluationId,
        evaluationTitle: "Ventilation basics",
        evaluationType: "QUIZ",
        assignmentId: item.assignmentId,
        attemptNumber: item.attemptNumber,
        student: { id: item.userId, name: "Student", email: "student@example.com" },
        status: item.status,
        submittedAt: item.submittedAt,
        score: item.score,
        maxScore: item.maxScore,
        legacy: item.legacySource !== undefined,
      }));

    return new Paginated<GradingQueueItemView>({ items, total: items.length, page: query.page, limit: query.limit });
  }

  public async getExpiredInProgressAttemptIds(filter: GradingAttemptFilter, cutoff: Date, limit: number): Promise<string[]> {
    await Promise.resolve();

    return this._matching(filter)
      .filter(
        (item: StudentEvaluationAttemptProps) =>
          item.status === "IN_PROGRESS" && item.legacySource === undefined && item.deadlineAt !== undefined && item.deadlineAt < cutoff,
      )
      .slice(0, limit)
      .map((item: StudentEvaluationAttemptProps) => item.id);
  }

  public async isAttemptInScope(attemptId: string): Promise<boolean> {
    await Promise.resolve();

    return this.scopedAttemptIds.has(attemptId);
  }

  public async getPublishableAttempts(filter: GradingAttemptFilter): Promise<GradingAttemptKey[]> {
    await Promise.resolve();

    return this._matching(filter)
      .filter((item: StudentEvaluationAttemptProps) => item.status === "GRADED" && item.gradePublishedAt === undefined)
      .map((item: StudentEvaluationAttemptProps) => ({ id: item.id, evaluationId: item.evaluationId, userId: item.userId }));
  }

  private _matching(filter: GradingAttemptFilter): StudentEvaluationAttemptProps[] {
    const scope: EvaluationAssignmentScope | undefined = filter.scope;

    return this._attempts
      .attempts()
      .filter((item: StudentEvaluationAttemptProps) => filter.evaluationId === undefined || item.evaluationId === filter.evaluationId)
      .filter((item: StudentEvaluationAttemptProps) => scope === undefined || this.scopedAttemptIds.has(item.id));
  }
}

export interface GradingDoubles extends AttemptDoubles {
  gradingRepository: InMemoryGradingRepository;
  gradingAccess: EvaluationGradingAccess;
  auditRecorder: IAuditRecorder;
  record: jest.Mock;
  supervisedGroupIds: jest.Mock;
}

export function buildGradingDoubles(state: AttemptState & { scopedAttemptIds?: string[] } = {}): GradingDoubles {
  const doubles: AttemptDoubles = buildAttemptDoubles(state);
  const gradingRepository: InMemoryGradingRepository = new InMemoryGradingRepository(doubles.attemptsRepository, state.scopedAttemptIds ?? []);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const supervisedGroupIds: jest.Mock = jest.fn().mockResolvedValue(["group-supervised"]);

  const assignmentAccess: EvaluationAssignmentAccess = {
    scopeFor: jest.fn().mockImplementation(async (actor: EvaluationActor) =>
      actor.role === "ADMIN" ? undefined : { teacherId: actor.id, supervisedGroupIds: await supervisedGroupIds() },
    ),
  } as unknown as EvaluationAssignmentAccess;

  return {
    ...doubles,
    gradingRepository,
    gradingAccess: new EvaluationGradingAccess(assignmentAccess, gradingRepository),
    auditRecorder: { record },
    record,
    supervisedGroupIds,
  };
}
