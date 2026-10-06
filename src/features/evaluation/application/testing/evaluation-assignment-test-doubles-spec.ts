/*
 * Funcionalidad: Dobles de prueba de asignaciones de evaluación
 * Descripción: Repositorios en memoria de evaluaciones y asignaciones, fachada de grupos simulada (alcance de gestión y grupo STUDENT del estudiante), auditoría, transacciones y bus de eventos simulados para las pruebas de activación; queda fuera del build por terminar en spec.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { TRANSACTION } from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  type EvaluationAssignmentGroupTarget,
  type EvaluationAssignmentView,
} from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import { type IEvaluationAssignmentsRepository } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";

export const HOUR: number = 60 * 60 * 1000;

export function fromNow(offsetHours: number): Date {
  return new Date(Date.now() + offsetHours * HOUR);
}

export function buildAssignment({
  id = "assignment-1",
  groupId = "group-1",
  startsAt = fromNow(-1),
  endsAt = fromNow(5),
  legacyIsActive,
}: { id?: string; groupId?: string; startsAt?: Date; endsAt?: Date; legacyIsActive?: boolean } = {}): EvaluationAssignment {
  return EvaluationAssignment.reconstitute({
    id,
    evaluationId: "evaluation-1",
    groupId,
    startsAt,
    endsAt,
    legacyIsActive,
    createdAt: fromNow(-48),
    updatedAt: fromNow(-48),
  });
}

export function studentGroup(id: string, overrides: Partial<EvaluationAssignmentGroupTarget> = {}): EvaluationAssignmentGroupTarget {
  return { id, name: `Group ${id}`, type: "STUDENT", isActive: true, ...overrides };
}

export function buildView(overrides: Partial<EvaluationAssignmentView> = {}): EvaluationAssignmentView {
  return {
    id: "assignment-1",
    evaluationId: "evaluation-1",
    evaluationTitle: "Ventilation basics",
    evaluationType: "QUIZ",
    evaluationStatus: "READY",
    groupId: "group-1",
    groupName: "Group group-1",
    startsAt: fromNow(-1),
    endsAt: fromNow(5),
    createdAt: fromNow(-48),
    updatedAt: fromNow(-48),
    attemptCounts: { inProgress: 0, submitted: 0, pendingReview: 0, graded: 0 },
    ...overrides,
  };
}

export interface AssignmentsState {
  evaluations?: Evaluation[];
  assignments?: EvaluationAssignment[];
  groups?: EvaluationAssignmentGroupTarget[];
  managedGroupIds?: string[];
  supervisedGroupIds?: string[];
  attempts?: number;
  studentGroupId?: string;
  views?: EvaluationAssignmentView[];
}

export interface AssignmentsDoubles {
  evaluationsRepository: IEvaluationsRepository;
  assignmentsRepository: IEvaluationAssignmentsRepository;
  transactionManager: ITransactionManager;
  eventBus: IEventBus;
  auditRecorder: IAuditRecorder;
  access: EvaluationAssignmentAccess;
  save: jest.Mock;
  remove: jest.Mock;
  acquireLock: jest.Mock;
  record: jest.Mock;
  publish: jest.Mock;
  canManageGroup: jest.Mock;
  getViews: jest.Mock;
  getViewsByEvaluation: jest.Mock;
  getStudentGroupViews: jest.Mock;
}

export function buildAssignmentDoubles(state: AssignmentsState = {}): AssignmentsDoubles {
  const evaluations: Evaluation[] = state.evaluations ?? [];
  const assignments: EvaluationAssignment[] = state.assignments ?? [];
  const groups: EvaluationAssignmentGroupTarget[] = state.groups ?? [];
  const managedGroupIds: string[] = state.managedGroupIds ?? [];
  const views: EvaluationAssignmentView[] = state.views ?? [];
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const remove: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const acquireLock: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const publish: jest.Mock = jest.fn();

  const canManageGroup: jest.Mock = jest
    .fn()
    .mockImplementation((actor: { role: string }, groupId: string) => Promise.resolve(actor.role === "ADMIN" || managedGroupIds.includes(groupId)));

  const getViews: jest.Mock = jest.fn().mockImplementation((query: { page: number; limit: number }) =>
    Promise.resolve(new Paginated<EvaluationAssignmentView>({ items: views, total: views.length, page: query.page, limit: query.limit })),
  );

  const getViewsByEvaluation: jest.Mock = jest.fn().mockResolvedValue(views);
  const getStudentGroupViews: jest.Mock = jest.fn().mockResolvedValue(views);

  const evaluationsRepository: IEvaluationsRepository = {
    getById: jest.fn().mockImplementation((id: string) => Promise.resolve(evaluations.find((evaluation: Evaluation) => evaluation.id === id))),
    getSummaries: jest.fn(),
    getUsage: jest.fn(),
    findMissingMediaIds: jest.fn(),
    findMissingReferences: jest.fn(),
    acquireTransactionLock: acquireLock,
    save: jest.fn(),
    delete: jest.fn(),
  };

  const assignmentsRepository: IEvaluationAssignmentsRepository = {
    getById: jest.fn().mockImplementation((id: string) => Promise.resolve(assignments.find((item: EvaluationAssignment) => item.id === id))),
    getByEvaluationAndGroups: jest
      .fn()
      .mockImplementation((evaluationId: string, groupIds: ReadonlyArray<string>) =>
        Promise.resolve(assignments.filter((item: EvaluationAssignment) => item.evaluationId === evaluationId && groupIds.includes(item.groupId))),
      ),
    getGroupTargets: jest
      .fn()
      .mockImplementation((groupIds: ReadonlyArray<string>) =>
        Promise.resolve(groups.filter((group: EvaluationAssignmentGroupTarget) => groupIds.includes(group.id))),
      ),
    countAttempts: jest.fn().mockResolvedValue(state.attempts ?? 0),
    getViews,
    getViewsByEvaluation,
    getStudentGroupViews,
    save,
    delete: remove,
  };

  const groupsFacade: GroupsFacade = {
    canManageGroup,
    getSupervisedStudentGroupIds: jest.fn().mockResolvedValue(state.supervisedGroupIds ?? []),
    getStudentGroupOfUser: jest
      .fn()
      .mockResolvedValue(state.studentGroupId ? { id: state.studentGroupId, name: "Group", members: [], supervisingGroups: [] } : undefined),
  } as unknown as GroupsFacade;

  const transactionManager: ITransactionManager = {
    run: <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => work(TRANSACTION),
  };

  return {
    evaluationsRepository,
    assignmentsRepository,
    transactionManager,
    eventBus: { publish },
    auditRecorder: { record },
    access: new EvaluationAssignmentAccess(groupsFacade),
    save,
    remove,
    acquireLock,
    record,
    publish,
    canManageGroup,
    getViews,
    getViewsByEvaluation,
    getStudentGroupViews,
  };
}

export function savedAssignments(doubles: AssignmentsDoubles): EvaluationAssignment[] {
  return doubles.save.mock.calls.map((call: unknown[]) => call[0] as EvaluationAssignment);
}
