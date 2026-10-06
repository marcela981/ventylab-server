/*
 * Funcionalidad: Entidad Evaluation
 * Descripción: Agregado de evaluación (EXAM, QUIZ o WORKSHOP) con sus escenarios, preguntas y opciones; aplica las transiciones de estado DRAFT/READY/ARCHIVED con validación de READY, marca los cambios estructurales (preguntas, opciones, corrección, puntos, tipo, rúbrica y caso clínico), reordena por lotes, duplica en profundidad y registra los cambios pendientes de persistir, la auditoría y los eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  type EvaluationLegacyData,
  type EvaluationOptionItem,
  type EvaluationPendingChanges,
  type EvaluationQuestionItem,
  type EvaluationScenarioItem,
  type OrderEntry,
  type QuestionOrderEntry,
} from "@/features/evaluation/domain/entities/evaluation-items";
import {
  EvaluationHasSubmittedAttemptsError,
  EvaluationNotReadyError,
  EvaluationOptionsNotAllowedError,
  EvaluationQuestionNotFoundError,
  EvaluationQuestionOptionNotFoundError,
  EvaluationScenarioNotFoundError,
  InvalidEvaluationReorderError,
  InvalidEvaluationStatusTransitionError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  EvaluationCreatedEvent,
  EvaluationDeletedEvent,
  EvaluationStatusChangedEvent,
  EvaluationUpdatedEvent,
} from "@/features/evaluation/domain/events/evaluation.events";
import { type EvaluationReadinessIssue, validateEvaluationReadiness } from "@/features/evaluation/domain/services/evaluation-readiness";
import { type EvaluationQuestionTypeValue, isChoiceQuestionType } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type EvaluationRichTextDocument } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";
import {
  DRAFT_EVALUATION_STATUS,
  type EvaluationStatusValue,
  isAllowedStatusTransition,
  READY_EVALUATION_STATUS,
} from "@/features/evaluation/domain/value-objects/evaluation-status";
import { defaultShowResultsImmediately, type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const EVALUATION_ENTITY_COLLECTION: string = "evaluations";
export const EVALUATION_ENTITY_TYPE: string = "evaluation";
export const DEFAULT_QUESTION_POINTS: number = 1;
export const DEFAULT_MAX_ATTEMPTS: number = 1;
export const DUPLICATE_TITLE_SUFFIX: string = " (copy)";

export type EvaluationAuditAction =
  | "evaluation_created"
  | "evaluation_updated"
  | "evaluation_status_changed"
  | "evaluation_deleted"
  | "evaluation_scenario_added"
  | "evaluation_scenario_updated"
  | "evaluation_scenario_removed"
  | "evaluation_question_added"
  | "evaluation_question_updated"
  | "evaluation_question_removed"
  | "evaluation_option_added"
  | "evaluation_option_updated"
  | "evaluation_option_removed"
  | "evaluation_items_reordered";

export interface EvaluationProps {
  id: string;
  type: EvaluationTypeValue;
  title: string;
  description?: string;
  moduleId?: string;
  levelId?: string;
  lessonId?: string;
  durationMinutes?: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  status: EvaluationStatusValue;
  order: number;
  createdById?: string;
  legacy: EvaluationLegacyData;
  createdAt: Date;
  updatedAt: Date;
  scenarios: EvaluationScenarioItem[];
  questions: EvaluationQuestionItem[];
  auditLogs: AuditLog<EvaluationAuditAction>[];
}

export interface EvaluationChanges {
  title?: string;
  description?: string | null;
  moduleId?: string | null;
  levelId?: string | null;
  lessonId?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
  order?: number;
}

export interface NewEvaluationScenario {
  content: EvaluationRichTextDocument;
  mediaIds?: string[];
}

export interface EvaluationScenarioChanges {
  content?: EvaluationRichTextDocument;
  mediaIds?: string[];
}

export interface NewEvaluationOption {
  content: string;
  isCorrect?: boolean;
  mediaId?: string;
}

export interface EvaluationOptionChanges {
  content?: string;
  isCorrect?: boolean;
  mediaId?: string | null;
}

export interface NewEvaluationQuestion {
  type: EvaluationQuestionTypeValue;
  prompt: EvaluationRichTextDocument;
  points?: number;
  explanation?: string;
  scenarioId?: string;
  mediaIds?: string[];
  clinicalCaseId?: string;
  rubric?: unknown;
  options?: NewEvaluationOption[];
}

export interface EvaluationQuestionChanges {
  type?: EvaluationQuestionTypeValue;
  prompt?: EvaluationRichTextDocument;
  points?: number;
  explanation?: string | null;
  scenarioId?: string | null;
  mediaIds?: string[];
  clinicalCaseId?: string | null;
  rubric?: unknown;
}

export interface QuestionReorderItem {
  id: string;
  order: number;
  scenarioId?: string | null;
}

export interface EvaluationStatusContext {
  hasSubmittedAttempts: boolean;
}

function byOrder<T extends { readonly order: number }>(left: T, right: T): number {
  return left.order - right.order;
}

function nextOrder(items: ReadonlyArray<{ readonly order: number }>): number {
  return items.length === 0 ? 0 : Math.max(...items.map((item: { readonly order: number }) => item.order)) + 1;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export class Evaluation extends AggregateRoot {
  private _id: string;
  private _type: EvaluationTypeValue;
  private _title: string;
  private _description?: string;
  private _moduleId?: string;
  private _levelId?: string;
  private _lessonId?: string;
  private _durationMinutes?: number;
  private _maxAttempts: number;
  private _shuffleQuestions: boolean;
  private _showResultsImmediately: boolean;
  private _status: EvaluationStatusValue;
  private _order: number;
  private _createdById?: string;
  private _legacy: EvaluationLegacyData;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _scenarios: EvaluationScenarioItem[];
  private _questions: EvaluationQuestionItem[];
  private _auditLogs: AuditLog<EvaluationAuditAction>[];
  private _structuralChange: boolean = false;
  private readonly _dirtyScenarioIds: Set<string> = new Set<string>();
  private readonly _dirtyQuestionIds: Set<string> = new Set<string>();
  private readonly _dirtyOptionIds: Set<string> = new Set<string>();
  private readonly _removedScenarioIds: Set<string> = new Set<string>();
  private readonly _removedQuestionIds: Set<string> = new Set<string>();
  private readonly _removedOptionIds: Set<string> = new Set<string>();
  private _questionOrder?: QuestionOrderEntry[];
  private _scenarioOrder?: OrderEntry[];
  private readonly _optionOrders: Map<string, OrderEntry[]> = new Map<string, OrderEntry[]>();

  private constructor(props: EvaluationProps) {
    super();
    this._id = props.id;
    this._type = props.type;
    this._title = props.title;
    this._description = props.description;
    this._moduleId = props.moduleId;
    this._levelId = props.levelId;
    this._lessonId = props.lessonId;
    this._durationMinutes = props.durationMinutes;
    this._maxAttempts = props.maxAttempts;
    this._shuffleQuestions = props.shuffleQuestions;
    this._showResultsImmediately = props.showResultsImmediately;
    this._status = props.status;
    this._order = props.order;
    this._createdById = props.createdById;
    this._legacy = props.legacy;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._scenarios = [...props.scenarios].sort(byOrder);
    this._questions = [...props.questions]
      .map((question: EvaluationQuestionItem) => ({ ...question, options: [...question.options].sort(byOrder) }))
      .sort(byOrder);
    this._auditLogs = props.auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get type(): EvaluationTypeValue {
    return this._type;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get moduleId(): string | undefined {
    return this._moduleId;
  }

  public get levelId(): string | undefined {
    return this._levelId;
  }

  public get lessonId(): string | undefined {
    return this._lessonId;
  }

  public get durationMinutes(): number | undefined {
    return this._durationMinutes;
  }

  public get maxAttempts(): number {
    return this._maxAttempts;
  }

  public get shuffleQuestions(): boolean {
    return this._shuffleQuestions;
  }

  public get showResultsImmediately(): boolean {
    return this._showResultsImmediately;
  }

  public get status(): EvaluationStatusValue {
    return this._status;
  }

  public get order(): number {
    return this._order;
  }

  public get createdById(): string | undefined {
    return this._createdById;
  }

  public get legacy(): EvaluationLegacyData {
    return this._legacy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get scenarios(): ReadonlyArray<EvaluationScenarioItem> {
    return this._scenarios;
  }

  public get questions(): ReadonlyArray<EvaluationQuestionItem> {
    return this._questions;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<EvaluationAuditAction>> {
    return this._auditLogs;
  }

  public get hasStructuralChanges(): boolean {
    return this._structuralChange;
  }

  public get referencedMediaIds(): string[] {
    const ids: string[] = [
      ...this._scenarios.flatMap((scenario: EvaluationScenarioItem) => scenario.mediaIds),
      ...this._questions.flatMap((question: EvaluationQuestionItem) => [
        ...question.mediaIds,
        ...question.options.flatMap((option: EvaluationOptionItem) => (option.mediaId ? [option.mediaId] : [])),
      ]),
    ];

    return [...new Set(ids)];
  }

  public get pendingChanges(): EvaluationPendingChanges {
    const options: EvaluationOptionItem[] = this._questions
      .flatMap((question: EvaluationQuestionItem) => question.options)
      .filter((option: EvaluationOptionItem) => this._dirtyOptionIds.has(option.id));

    return {
      scenarios: this._scenarios.filter((scenario: EvaluationScenarioItem) => this._dirtyScenarioIds.has(scenario.id)),
      questions: this._questions.filter((question: EvaluationQuestionItem) => this._dirtyQuestionIds.has(question.id)),
      options,
      removedScenarioIds: [...this._removedScenarioIds],
      removedQuestionIds: [...this._removedQuestionIds],
      removedOptionIds: [...this._removedOptionIds],
      questionOrder: this._questionOrder,
      scenarioOrder: this._scenarioOrder,
      optionOrders: [...this._optionOrders.entries()].map(([questionId, entries]: [string, OrderEntry[]]) => ({ questionId, entries })),
    };
  }

  public static create({
    type,
    title,
    description,
    moduleId,
    levelId,
    lessonId,
    durationMinutes,
    maxAttempts,
    shuffleQuestions,
    showResultsImmediately,
    createdById,
  }: {
    type: EvaluationTypeValue;
    title: string;
    description?: string;
    moduleId?: string;
    levelId?: string;
    lessonId?: string;
    durationMinutes?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    showResultsImmediately?: boolean;
    createdById: string;
  }): Evaluation {
    const now: Date = new Date();
    const id: string = generateId();

    const evaluation: Evaluation = new Evaluation({
      id,
      type,
      title,
      description,
      moduleId,
      levelId,
      lessonId,
      durationMinutes,
      maxAttempts: maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      shuffleQuestions: shuffleQuestions ?? false,
      showResultsImmediately: showResultsImmediately ?? defaultShowResultsImmediately(type),
      status: DRAFT_EVALUATION_STATUS,
      order: 0,
      createdById,
      legacy: {},
      createdAt: now,
      updatedAt: now,
      scenarios: [],
      questions: [],
      auditLogs: [
        AuditLog.create<EvaluationAuditAction>({
          action: "evaluation_created",
          performedByUserId: createdById,
          metadata: { type, title },
        }),
      ],
    });

    evaluation.publishEvent(new EvaluationCreatedEvent({ evaluationId: id, performedBy: createdById }));

    return evaluation;
  }

  public static reconstitute(props: EvaluationProps): Evaluation {
    return new Evaluation(props);
  }

  public toSnapshot(): EvaluationProps {
    return {
      id: this._id,
      type: this._type,
      title: this._title,
      description: this._description,
      moduleId: this._moduleId,
      levelId: this._levelId,
      lessonId: this._lessonId,
      durationMinutes: this._durationMinutes,
      maxAttempts: this._maxAttempts,
      shuffleQuestions: this._shuffleQuestions,
      showResultsImmediately: this._showResultsImmediately,
      status: this._status,
      order: this._order,
      createdById: this._createdById,
      legacy: this._legacy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      scenarios: [...this._scenarios],
      questions: [...this._questions],
      auditLogs: [],
    };
  }

  public readinessIssues(): EvaluationReadinessIssue[] {
    return validateEvaluationReadiness(this._questions);
  }

  public assertConsistentWithStatus(): void {
    if (this._status !== READY_EVALUATION_STATUS) {
      return;
    }

    const issues: EvaluationReadinessIssue[] = this.readinessIssues();

    if (issues.length > 0) {
      throw new EvaluationNotReadyError(issues);
    }
  }

  public update(changes: EvaluationChanges, performedBy: string): void {
    const recorded: Record<string, { before: unknown; after: unknown }> = {};

    if (changes.title !== undefined) {
      recorded.title = { before: this._title, after: changes.title };
      this._title = changes.title;
    }

    if (changes.description !== undefined) {
      recorded.description = { before: this._description ?? null, after: changes.description };
      this._description = changes.description ?? undefined;
    }

    if (changes.moduleId !== undefined) {
      recorded.moduleId = { before: this._moduleId ?? null, after: changes.moduleId };
      this._moduleId = changes.moduleId ?? undefined;
    }

    if (changes.levelId !== undefined) {
      recorded.levelId = { before: this._levelId ?? null, after: changes.levelId };
      this._levelId = changes.levelId ?? undefined;
    }

    if (changes.lessonId !== undefined) {
      recorded.lessonId = { before: this._lessonId ?? null, after: changes.lessonId };
      this._lessonId = changes.lessonId ?? undefined;
    }

    if (changes.durationMinutes !== undefined) {
      recorded.durationMinutes = { before: this._durationMinutes ?? null, after: changes.durationMinutes };
      this._durationMinutes = changes.durationMinutes ?? undefined;
    }

    if (changes.maxAttempts !== undefined) {
      recorded.maxAttempts = { before: this._maxAttempts, after: changes.maxAttempts };
      this._maxAttempts = changes.maxAttempts;
    }

    if (changes.shuffleQuestions !== undefined) {
      recorded.shuffleQuestions = { before: this._shuffleQuestions, after: changes.shuffleQuestions };
      this._shuffleQuestions = changes.shuffleQuestions;
    }

    if (changes.showResultsImmediately !== undefined) {
      recorded.showResultsImmediately = { before: this._showResultsImmediately, after: changes.showResultsImmediately };
      this._showResultsImmediately = changes.showResultsImmediately;
    }

    if (changes.order !== undefined) {
      recorded.order = { before: this._order, after: changes.order };
      this._order = changes.order;
    }

    this._touch("evaluation_updated", performedBy, { changes: recorded });
  }

  public changeStatus(status: EvaluationStatusValue, context: EvaluationStatusContext, performedBy: string): void {
    if (status === this._status) {
      return;
    }

    if (!isAllowedStatusTransition(this._status, status)) {
      throw new InvalidEvaluationStatusTransitionError(this._status, status);
    }

    if (status === READY_EVALUATION_STATUS) {
      const issues: EvaluationReadinessIssue[] = this.readinessIssues();

      if (issues.length > 0) {
        throw new EvaluationNotReadyError(issues);
      }
    }

    if (this._status === READY_EVALUATION_STATUS && status === DRAFT_EVALUATION_STATUS && context.hasSubmittedAttempts) {
      throw new EvaluationHasSubmittedAttemptsError();
    }

    const from: EvaluationStatusValue = this._status;

    this._status = status;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<EvaluationAuditAction>({
        action: "evaluation_status_changed",
        performedByUserId: performedBy,
        metadata: { changes: { status: { before: from, after: status } } },
      }),
    );

    this.publishEvent(new EvaluationStatusChangedEvent({ evaluationId: this._id, from, to: status, performedBy }));
  }

  public addScenario(input: NewEvaluationScenario, performedBy: string): string {
    const scenario: EvaluationScenarioItem = {
      id: generateId(),
      evaluationId: this._id,
      order: nextOrder(this._scenarios),
      content: input.content,
      mediaIds: input.mediaIds ?? [],
    };

    this._scenarios.push(scenario);
    this._dirtyScenarioIds.add(scenario.id);
    this._touch("evaluation_scenario_added", performedBy, { scenarioId: scenario.id });

    return scenario.id;
  }

  public updateScenario(scenarioId: string, changes: EvaluationScenarioChanges, performedBy: string): void {
    const scenario: EvaluationScenarioItem = this._findScenario(scenarioId);

    this._replaceScenario({
      ...scenario,
      content: changes.content ?? scenario.content,
      mediaIds: changes.mediaIds ?? scenario.mediaIds,
    });
    this._touch("evaluation_scenario_updated", performedBy, { scenarioId });
  }

  public removeScenario(scenarioId: string, performedBy: string): void {
    this._findScenario(scenarioId);

    this._scenarios = this._scenarios.filter((scenario: EvaluationScenarioItem) => scenario.id !== scenarioId);
    this._dirtyScenarioIds.delete(scenarioId);
    this._removedScenarioIds.add(scenarioId);

    for (const question of this._questions.filter((item: EvaluationQuestionItem) => item.scenarioId === scenarioId)) {
      this._replaceQuestion({ ...question, scenarioId: undefined });
    }

    this._touch("evaluation_scenario_removed", performedBy, { scenarioId });
  }

  public addQuestion(input: NewEvaluationQuestion, performedBy: string): string {
    if (input.scenarioId !== undefined) {
      this._findScenario(input.scenarioId);
    }

    const options: NewEvaluationOption[] = input.options ?? [];

    if (options.length > 0 && !isChoiceQuestionType(input.type)) {
      throw new EvaluationOptionsNotAllowedError();
    }

    const id: string = generateId();

    const question: EvaluationQuestionItem = {
      id,
      evaluationId: this._id,
      scenarioId: input.scenarioId,
      order: nextOrder(this._questions),
      type: input.type,
      prompt: input.prompt,
      mediaIds: input.mediaIds ?? [],
      points: input.points ?? DEFAULT_QUESTION_POINTS,
      explanation: input.explanation,
      clinicalCaseId: input.clinicalCaseId,
      rubric: input.rubric,
      options: options.map((option: NewEvaluationOption, index: number) => this._newOption(id, index, option)),
    };

    this._questions.push(question);
    this._dirtyQuestionIds.add(id);
    question.options.forEach((option: EvaluationOptionItem) => this._dirtyOptionIds.add(option.id));
    this._structuralChange = true;
    this._touch("evaluation_question_added", performedBy, { questionId: id, type: input.type });

    return id;
  }

  public updateQuestion(questionId: string, changes: EvaluationQuestionChanges, performedBy: string): void {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);

    if (changes.scenarioId !== undefined && changes.scenarioId !== null) {
      this._findScenario(changes.scenarioId);
    }

    const type: EvaluationQuestionTypeValue = changes.type ?? question.type;

    if (!isChoiceQuestionType(type) && question.options.length > 0) {
      throw new EvaluationOptionsNotAllowedError();
    }

    const updated: EvaluationQuestionItem = {
      ...question,
      type,
      prompt: changes.prompt ?? question.prompt,
      points: changes.points ?? question.points,
      explanation: changes.explanation === undefined ? question.explanation : (changes.explanation ?? undefined),
      scenarioId: changes.scenarioId === undefined ? question.scenarioId : (changes.scenarioId ?? undefined),
      mediaIds: changes.mediaIds ?? question.mediaIds,
      clinicalCaseId: changes.clinicalCaseId === undefined ? question.clinicalCaseId : (changes.clinicalCaseId ?? undefined),
      rubric: changes.rubric === undefined ? question.rubric : (changes.rubric ?? undefined),
    };

    if (
      updated.type !== question.type ||
      updated.points !== question.points ||
      updated.clinicalCaseId !== question.clinicalCaseId ||
      !sameJson(updated.rubric, question.rubric)
    ) {
      this._structuralChange = true;
    }

    this._replaceQuestion(updated);
    this._touch("evaluation_question_updated", performedBy, { questionId });
  }

  public removeQuestion(questionId: string, performedBy: string): void {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);

    this._questions = this._questions.filter((item: EvaluationQuestionItem) => item.id !== questionId);
    this._dirtyQuestionIds.delete(questionId);
    question.options.forEach((option: EvaluationOptionItem) => this._dirtyOptionIds.delete(option.id));
    this._optionOrders.delete(questionId);
    this._removedQuestionIds.add(questionId);
    this._structuralChange = true;
    this._touch("evaluation_question_removed", performedBy, { questionId });
  }

  public addOption(questionId: string, input: NewEvaluationOption, performedBy: string): string {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);

    if (!isChoiceQuestionType(question.type)) {
      throw new EvaluationOptionsNotAllowedError();
    }

    const option: EvaluationOptionItem = this._newOption(questionId, nextOrder(question.options), input);

    this._replaceQuestion({ ...question, options: [...question.options, option] }, false);
    this._dirtyOptionIds.add(option.id);
    this._structuralChange = true;
    this._touch("evaluation_option_added", performedBy, { questionId, optionId: option.id });

    return option.id;
  }

  public updateOption(questionId: string, optionId: string, changes: EvaluationOptionChanges, performedBy: string): void {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);
    const option: EvaluationOptionItem = this._findOption(question, optionId);

    const updated: EvaluationOptionItem = {
      ...option,
      content: changes.content ?? option.content,
      isCorrect: changes.isCorrect ?? option.isCorrect,
      mediaId: changes.mediaId === undefined ? option.mediaId : (changes.mediaId ?? undefined),
    };

    if (updated.isCorrect !== option.isCorrect) {
      this._structuralChange = true;
    }

    this._replaceQuestion(
      { ...question, options: question.options.map((item: EvaluationOptionItem) => (item.id === optionId ? updated : item)) },
      false,
    );
    this._dirtyOptionIds.add(optionId);
    this._touch("evaluation_option_updated", performedBy, { questionId, optionId });
  }

  public removeOption(questionId: string, optionId: string, performedBy: string): void {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);

    this._findOption(question, optionId);
    this._replaceQuestion({ ...question, options: question.options.filter((item: EvaluationOptionItem) => item.id !== optionId) }, false);
    this._dirtyOptionIds.delete(optionId);
    this._removedOptionIds.add(optionId);
    this._structuralChange = true;
    this._touch("evaluation_option_removed", performedBy, { questionId, optionId });
  }

  public reorderQuestions(items: ReadonlyArray<QuestionReorderItem>, performedBy: string): void {
    this._assertReorderable(
      items.map((item: QuestionReorderItem) => item.id),
      this._questions.map((question: EvaluationQuestionItem) => question.id),
    );

    const scenarioIds: Set<string> = new Set(this._scenarios.map((scenario: EvaluationScenarioItem) => scenario.id));

    if (items.some((item: QuestionReorderItem) => typeof item.scenarioId === "string" && !scenarioIds.has(item.scenarioId))) {
      throw new InvalidEvaluationReorderError();
    }

    const entries: QuestionOrderEntry[] = items.map((item: QuestionReorderItem) => ({
      id: item.id,
      order: item.order,
      scenarioId: item.scenarioId ?? undefined,
      setScenario: item.scenarioId !== undefined,
    }));
    const byId: Map<string, QuestionOrderEntry> = new Map(entries.map((entry: QuestionOrderEntry): [string, QuestionOrderEntry] => [entry.id, entry]));

    this._questions = this._questions
      .map((question: EvaluationQuestionItem) => {
        const entry: QuestionOrderEntry | undefined = byId.get(question.id);

        if (!entry) {
          return question;
        }

        return { ...question, order: entry.order, scenarioId: entry.setScenario ? entry.scenarioId : question.scenarioId };
      })
      .sort(byOrder);
    this._questionOrder = entries;
    this._touch("evaluation_items_reordered", performedBy, { target: "questions", count: entries.length });
  }

  public reorderScenarios(items: ReadonlyArray<OrderEntry>, performedBy: string): void {
    this._assertReorderable(
      items.map((item: OrderEntry) => item.id),
      this._scenarios.map((scenario: EvaluationScenarioItem) => scenario.id),
    );

    const entries: OrderEntry[] = items.map((item: OrderEntry) => ({ id: item.id, order: item.order }));
    const byId: Map<string, number> = new Map(entries.map((entry: OrderEntry): [string, number] => [entry.id, entry.order]));

    this._scenarios = this._scenarios
      .map((scenario: EvaluationScenarioItem) => ({ ...scenario, order: byId.get(scenario.id) ?? scenario.order }))
      .sort(byOrder);
    this._scenarioOrder = entries;
    this._touch("evaluation_items_reordered", performedBy, { target: "scenarios", count: entries.length });
  }

  public reorderOptions(questionId: string, items: ReadonlyArray<OrderEntry>, performedBy: string): void {
    const question: EvaluationQuestionItem = this._findQuestion(questionId);

    this._assertReorderable(
      items.map((item: OrderEntry) => item.id),
      question.options.map((option: EvaluationOptionItem) => option.id),
    );

    const entries: OrderEntry[] = items.map((item: OrderEntry) => ({ id: item.id, order: item.order }));
    const byId: Map<string, number> = new Map(entries.map((entry: OrderEntry): [string, number] => [entry.id, entry.order]));
    const options: EvaluationOptionItem[] = question.options
      .map((option: EvaluationOptionItem) => ({ ...option, order: byId.get(option.id) ?? option.order }))
      .sort(byOrder);

    this._replaceQuestion({ ...question, options }, false);
    this._optionOrders.set(questionId, entries);
    this._touch("evaluation_items_reordered", performedBy, { target: "options", questionId, count: entries.length });
  }

  public duplicate(createdById: string): Evaluation {
    const now: Date = new Date();
    const id: string = generateId();
    const scenarioIds: Map<string, string> = new Map<string, string>();

    const scenarios: EvaluationScenarioItem[] = this._scenarios.map((scenario: EvaluationScenarioItem) => {
      const copyId: string = generateId();

      scenarioIds.set(scenario.id, copyId);

      return { ...scenario, id: copyId, evaluationId: id, mediaIds: [...scenario.mediaIds] };
    });

    const questions: EvaluationQuestionItem[] = this._questions.map((question: EvaluationQuestionItem) => {
      const questionId: string = generateId();

      return {
        ...question,
        id: questionId,
        evaluationId: id,
        scenarioId: question.scenarioId ? scenarioIds.get(question.scenarioId) : undefined,
        mediaIds: [...question.mediaIds],
        legacyType: undefined,
        legacyRef: undefined,
        options: question.options.map((option: EvaluationOptionItem) => ({ ...option, id: generateId(), questionId, legacyRef: undefined })),
      };
    });

    const copy: Evaluation = new Evaluation({
      ...this.toSnapshot(),
      id,
      title: `${this._title}${DUPLICATE_TITLE_SUFFIX}`,
      status: DRAFT_EVALUATION_STATUS,
      createdById,
      legacy: {},
      createdAt: now,
      updatedAt: now,
      scenarios,
      questions,
      auditLogs: [
        AuditLog.create<EvaluationAuditAction>({
          action: "evaluation_created",
          performedByUserId: createdById,
          metadata: { type: this._type, title: `${this._title}${DUPLICATE_TITLE_SUFFIX}`, duplicatedFromId: this._id },
        }),
      ],
    });

    copy._markEverythingDirty();
    copy.publishEvent(new EvaluationCreatedEvent({ evaluationId: id, duplicatedFromId: this._id, performedBy: createdById }));

    return copy;
  }

  public markDeleted(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<EvaluationAuditAction>({
        action: "evaluation_deleted",
        performedByUserId: performedBy,
        metadata: { title: this._title, type: this._type },
      }),
    );

    this.publishEvent(new EvaluationDeletedEvent({ evaluationId: this._id, performedBy }));
  }

  private _markEverythingDirty(): void {
    this._scenarios.forEach((scenario: EvaluationScenarioItem) => this._dirtyScenarioIds.add(scenario.id));
    this._questions.forEach((question: EvaluationQuestionItem) => {
      this._dirtyQuestionIds.add(question.id);
      question.options.forEach((option: EvaluationOptionItem) => this._dirtyOptionIds.add(option.id));
    });
  }

  private _newOption(questionId: string, order: number, input: NewEvaluationOption): EvaluationOptionItem {
    return {
      id: generateId(),
      questionId,
      order,
      content: input.content,
      mediaId: input.mediaId,
      isCorrect: input.isCorrect ?? false,
    };
  }

  private _findScenario(scenarioId: string): EvaluationScenarioItem {
    const scenario: EvaluationScenarioItem | undefined = this._scenarios.find((item: EvaluationScenarioItem) => item.id === scenarioId);

    if (!scenario) {
      throw new EvaluationScenarioNotFoundError();
    }

    return scenario;
  }

  private _findQuestion(questionId: string): EvaluationQuestionItem {
    const question: EvaluationQuestionItem | undefined = this._questions.find((item: EvaluationQuestionItem) => item.id === questionId);

    if (!question) {
      throw new EvaluationQuestionNotFoundError();
    }

    return question;
  }

  private _findOption(question: EvaluationQuestionItem, optionId: string): EvaluationOptionItem {
    const option: EvaluationOptionItem | undefined = question.options.find((item: EvaluationOptionItem) => item.id === optionId);

    if (!option) {
      throw new EvaluationQuestionOptionNotFoundError();
    }

    return option;
  }

  private _replaceScenario(scenario: EvaluationScenarioItem): void {
    this._scenarios = this._scenarios.map((item: EvaluationScenarioItem) => (item.id === scenario.id ? scenario : item));
    this._dirtyScenarioIds.add(scenario.id);
  }

  private _replaceQuestion(question: EvaluationQuestionItem, markDirty: boolean = true): void {
    this._questions = this._questions.map((item: EvaluationQuestionItem) => (item.id === question.id ? question : item));

    if (markDirty) {
      this._dirtyQuestionIds.add(question.id);
    }
  }

  private _assertReorderable(requestedIds: ReadonlyArray<string>, existingIds: ReadonlyArray<string>): void {
    const existing: Set<string> = new Set(existingIds);

    if (
      requestedIds.length === 0 ||
      new Set(requestedIds).size !== requestedIds.length ||
      requestedIds.some((id: string) => !existing.has(id))
    ) {
      throw new InvalidEvaluationReorderError();
    }
  }

  private _touch(action: EvaluationAuditAction, performedBy: string, metadata: Record<string, unknown>): void {
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<EvaluationAuditAction>({
        action,
        performedByUserId: performedBy,
        metadata,
      }),
    );

    this.publishEvent(new EvaluationUpdatedEvent({ evaluationId: this._id, action, performedBy }));
  }
}
