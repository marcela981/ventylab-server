/*
 * Funcionalidad: Caso de uso RecordPageViewUseCase
 * Descripción: Registra de forma idempotente la vista de una página visible para el usuario (upsert de PageProgress sin reiniciar completedAt); en la misma transacción completa la lección cuando todas sus páginas publicadas están vistas (LessonCompletion), sincroniza UserProgress y publica LessonCompletedEvent
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { isLessonCompleted } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { RecordPageViewCommand } from "@/features/progress/application/commands/record-page-view.command";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { type PageViewResult, type PageViewSnapshot, type PageViewTarget } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ModuleCounters } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { decidePageView, shouldRecordLessonCompletion } from "@/features/progress/domain/services/page-view-rules";

interface PageViewOutcome {
  readonly result: PageViewResult;
  readonly event?: LessonCompletedEvent;
}

/**
 * @throws {PageNotFoundError} If the page does not exist or is not visible to the user
 */
@Injectable()
export class RecordPageViewUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RecordPageViewCommand): Promise<PageViewResult> {
    const found: { target: PageViewTarget; chain: ContentStatusChain } | undefined = await this._learningProgressRepository.getPageViewTarget(command.pageId);

    if (!found || !isContentVisible(command.canManage, found.chain)) {
      throw new PageNotFoundError();
    }

    const outcome: PageViewOutcome = await this._transactionManager.run(
      async (transaction: unknown): Promise<PageViewOutcome> => await this._record(command.userId, found.target, new Date(), transaction),
    );

    if (outcome.event) {
      this._eventBus.publish([outcome.event]);
    }

    return outcome.result;
  }

  private async _record(userId: string, target: PageViewTarget, now: Date, transaction: unknown): Promise<PageViewOutcome> {
    const existing: PageViewSnapshot | undefined = await this._learningProgressRepository.getPageView(userId, target.pageId, transaction);
    const view: PageViewSnapshot = await this._learningProgressRepository.savePageView(userId, target.pageId, decidePageView(existing, now), transaction);
    const baseResult: PageViewResult = {
      pageId: target.pageId,
      lessonId: target.lessonId,
      firstViewedAt: view.firstViewedAt ?? now,
      lastVisitedAt: view.lastVisitedAt ?? now,
      lessonCompleted: false,
      lessonJustCompleted: false,
      viewedPages: 0,
      totalPages: 0,
    };

    if (!target.lessonId) {
      return { result: baseResult };
    }

    const [fact]: LessonCompletionFact[] = await this._learningProgressRepository.getLessonFacts(userId, [target.lessonId], transaction);

    if (!fact) {
      return { result: baseResult };
    }

    const lessonJustCompleted: boolean = shouldRecordLessonCompletion(fact);

    if (lessonJustCompleted) {
      await this._learningProgressRepository.markLessonCompleted(userId, fact.lessonId, now, transaction);
    }

    const counters: ModuleCounters | undefined = await this._progressRepository.refreshModuleCounters(
      { userId, moduleId: fact.moduleId, lastAccessedLessonId: fact.lessonId },
      transaction,
    );

    const result: PageViewResult = {
      ...baseResult,
      lessonCompleted: isLessonCompleted(fact),
      lessonJustCompleted,
      viewedPages: Math.min(fact.viewedPageCount, fact.publishedPageCount),
      totalPages: fact.publishedPageCount,
    };

    return lessonJustCompleted
      ? { result, event: new LessonCompletedEvent({ userId, lessonId: fact.lessonId, moduleId: fact.moduleId, moduleCompleted: counters?.isModuleCompleted === true }) }
      : { result };
  }
}
