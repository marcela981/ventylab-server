/*
 * Funcionalidad: Caso de uso UpsertAiRatingUseCase
 * Descripción: Crea o edita la valoración de un usuario sobre una salida de IA (una fila por usuario, tipo de objetivo y objetivo) dentro de una transacción; solo el destinatario de la salida puede valorarla y el aiCallId guardado es el del objetivo o, si el objetivo no lo conoce, uno enviado por el cliente que coincida con el usuario y el caso de uso (validado con AiTelemetryFacade)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type UpsertAiRatingCommand } from "@/features/ai-ratings/application/commands/upsert-ai-rating.command";
import {
  type IRatingTargetResolver,
  RATING_TARGET_RESOLVER_TOKEN,
  type RatingTarget,
} from "@/features/ai-ratings/application/ports/rating-target-resolver.interface";
import { AiRatingCallMismatchError, AiRatingNotRecipientError, AiRatingTargetNotFoundError } from "@/features/ai-ratings/domain/ai-ratings.errors";
import { AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import { AI_RATING_TARGET_USE_CASES } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_RATINGS_REPOSITORY_TOKEN, type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";
import { AiRatingAnswers } from "@/features/ai-ratings/domain/value-objects/ai-rating-answers";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallSummary } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

/**
 * @throws {InvalidAiRatingScoreError} If a Likert dimension is not an integer between 1 and 5
 * @throws {AiRatingCommentTooLongError} If the comment exceeds the maximum length
 * @throws {AiRatingTargetNotFoundError} If the target does not exist or is not visible to its recipient yet
 * @throws {AiRatingNotRecipientError} If the caller is not the recipient of the AI output
 * @throws {AiRatingCallMismatchError} If the client aiCallId does not match the rated output
 */
@Injectable()
export class UpsertAiRatingUseCase {
  public constructor(
    @Inject(AI_RATINGS_REPOSITORY_TOKEN)
    private readonly _aiRatingsRepository: IAiRatingsRepository,
    @Inject(RATING_TARGET_RESOLVER_TOKEN)
    private readonly _ratingTargetResolver: IRatingTargetResolver,
    private readonly _aiTelemetryFacade: AiTelemetryFacade,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: UpsertAiRatingCommand): Promise<void> {
    const answers: AiRatingAnswers = AiRatingAnswers.create({
      helpful: command.helpful,
      comment: command.comment,
      quality: command.quality,
      understanding: command.understanding,
      expression: command.expression,
      safety: command.safety,
      trust: command.trust,
    });

    const target: RatingTarget | undefined = await this._ratingTargetResolver.resolve(command.targetType, command.targetId);

    if (!target) {
      throw new AiRatingTargetNotFoundError();
    }

    if (target.recipientUserId !== command.userId) {
      throw new AiRatingNotRecipientError();
    }

    const aiCallId: string | undefined = await this._resolveAiCallId(command, target);

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const existing: AiRating | undefined = await this._aiRatingsRepository.getByUserAndTarget(
        command.userId,
        command.targetType,
        command.targetId,
        transaction,
      );

      if (existing) {
        existing.answer(answers, aiCallId);
      }

      const rating: AiRating =
        existing ??
        AiRating.create({ userId: command.userId, targetType: command.targetType, targetId: command.targetId, aiCallId, answers });

      await this._aiRatingsRepository.save(rating, transaction);
    });
  }

  private async _resolveAiCallId(command: UpsertAiRatingCommand, target: RatingTarget): Promise<string | undefined> {
    if (target.aiCallId) {
      if (command.aiCallId !== undefined && command.aiCallId !== target.aiCallId) {
        throw new AiRatingCallMismatchError();
      }

      return target.aiCallId;
    }

    if (command.aiCallId === undefined) {
      return undefined;
    }

    const call: AiCallSummary | undefined = await this._aiTelemetryFacade.getCallById(command.aiCallId);

    const matches: boolean =
      call !== undefined &&
      AI_RATING_TARGET_USE_CASES[command.targetType].includes(call.useCase) &&
      (call.userId === undefined || call.userId === command.userId);

    if (!matches) {
      throw new AiRatingCallMismatchError();
    }

    return command.aiCallId;
  }
}
