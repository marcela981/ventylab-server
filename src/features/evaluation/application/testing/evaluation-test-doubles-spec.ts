/*
 * Funcionalidad: Dobles de prueba de evaluaciones
 * Descripción: Constructores de evaluaciones y repositorio en memoria, gestor de transacciones y bus de eventos simulados para las pruebas unitarias de la feature de evaluaciones; queda fuera del build por terminar en spec.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import { type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export const TRANSACTION: string = "tx";

export const OWNER: EvaluationActor = { id: "teacher-1", role: "TEACHER" };
export const OTHER_TEACHER: EvaluationActor = { id: "teacher-2", role: "TEACHER" };
export const ADMIN: EvaluationActor = { id: "admin-1", role: "ADMIN" };

export const PROMPT: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Which PEEP is typical?" }] }],
};

export function buildEvaluation({
  type = "QUIZ",
  createdById = OWNER.id,
  ready = false,
}: { type?: "QUIZ" | "EXAM" | "WORKSHOP"; createdById?: string; ready?: boolean } = {}): Evaluation {
  const created: Evaluation = Evaluation.create({ type, title: "Ventilation basics", createdById });

  created.addQuestion(
    {
      type: "SINGLE_CHOICE",
      prompt: PROMPT,
      points: 1,
      options: [
        { content: "5 cmH2O", isCorrect: true },
        { content: "20 cmH2O", isCorrect: false },
      ],
    },
    createdById,
  );

  if (ready) {
    created.changeStatus("READY", { hasSubmittedAttempts: false }, createdById);
  }

  return Evaluation.reconstitute({ ...created.toSnapshot(), id: "evaluation-1" });
}

export interface EvaluationsState {
  evaluations?: Evaluation[];
  usage?: Partial<EvaluationUsage>;
  missingMediaIds?: string[];
  missingReferences?: string[];
}

export interface EvaluationsDoubles {
  repository: IEvaluationsRepository;
  transactionManager: ITransactionManager;
  eventBus: IEventBus;
  editor: EvaluationEditor;
  save: jest.Mock;
  remove: jest.Mock;
  acquireLock: jest.Mock;
  getUsage: jest.Mock;
  findMissingMediaIds: jest.Mock;
  findMissingReferences: jest.Mock;
  publish: jest.Mock;
}

export function buildDoubles(state: EvaluationsState = {}): EvaluationsDoubles {
  const evaluations: Evaluation[] = state.evaluations ?? [];
  const usage: EvaluationUsage = { attempts: 0, submittedAttempts: 0, assignments: 0, ...state.usage };
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const remove: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const acquireLock: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const getUsage: jest.Mock = jest.fn().mockResolvedValue(usage);
  const findMissingMediaIds: jest.Mock = jest
    .fn()
    .mockImplementation((ids: ReadonlyArray<string>) => Promise.resolve(ids.filter((id: string) => (state.missingMediaIds ?? []).includes(id))));
  const findMissingReferences: jest.Mock = jest.fn().mockResolvedValue(state.missingReferences ?? []);
  const publish: jest.Mock = jest.fn();

  const repository: IEvaluationsRepository = {
    getById: jest.fn().mockImplementation((id: string) => Promise.resolve(evaluations.find((evaluation: Evaluation) => evaluation.id === id))),
    getSummaries: jest.fn(),
    getUsage,
    findMissingMediaIds,
    findMissingReferences,
    acquireTransactionLock: acquireLock,
    save,
    delete: remove,
  };

  const transactionManager: ITransactionManager = {
    run: <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => work(TRANSACTION),
  };

  const eventBus: IEventBus = { publish };

  return {
    repository,
    transactionManager,
    eventBus,
    editor: new EvaluationEditor(repository, transactionManager, eventBus),
    save,
    remove,
    acquireLock,
    getUsage,
    findMissingMediaIds,
    findMissingReferences,
    publish,
  };
}

export function savedEvaluation(doubles: EvaluationsDoubles): Evaluation {
  return doubles.save.mock.calls[0][0] as Evaluation;
}
