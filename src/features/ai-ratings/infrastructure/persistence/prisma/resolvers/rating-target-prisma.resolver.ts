/*
 * Funcionalidad: Resolvedor Prisma de objetivos de valoración de IA
 * Descripción: Implementa IRatingTargetResolver. GRADE_FEEDBACK: el objetivo es el id de una fila de grade_feedbacks (general o por pregunta) en estado READY de un intento con calificación publicada; destinatario = dueño del intento y aiCallId = última llamada SUCCESS o FALLBACK enlazada al intento (refType evaluation_attempt) leída con AiTelemetryFacade. MESSAGE: id de un ai_messages con rol ASSISTANT; destinatario = dueño de la conversación y aiCallId del mensaje. NOTES_ANALYSIS: el análisis no se persiste, el objetivo es el aiCallId de la llamada (caso de uso NOTES_ANALYSIS) leído con AiTelemetryFacade. SIM_ASSIST: sin persistencia todavía, siempre undefined (404)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type IRatingTargetResolver, type RatingTarget } from "@/features/ai-ratings/application/ports/rating-target-resolver.interface";
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallSummary } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const GRADE_FEEDBACK_CALL_REF_TYPE: string = "evaluation_attempt";

interface GradeFeedbackTargetRow {
  readonly status: string;
  readonly attemptId: string;
  readonly attempt: { readonly userId: string; readonly gradePublishedAt: Date | null };
}

interface MessageTargetRow {
  readonly role: string;
  readonly aiCallId: string | null;
  readonly conversation: { readonly userId: string };
}

// Technical debt: ai-ratings may only depend on ai-telemetry, so grade feedback and tutor messages are read straight from their tables instead of through the evaluation and ai-tutor facades.
@Injectable()
export class RatingTargetPrismaResolver implements IRatingTargetResolver {
  public constructor(
    private readonly _prisma: PrismaService,
    private readonly _aiTelemetryFacade: AiTelemetryFacade,
  ) {}

  public async resolve(targetType: AiRatingTargetTypeValue, targetId: string): Promise<RatingTarget | undefined> {
    switch (targetType) {
      case "GRADE_FEEDBACK":
        return this._resolveGradeFeedback(targetId);
      case "MESSAGE":
        return this._resolveMessage(targetId);
      case "NOTES_ANALYSIS":
        return this._resolveNotesAnalysis(targetId);
      case "SIM_ASSIST":
        return undefined;
    }
  }

  private async _resolveGradeFeedback(feedbackId: string): Promise<RatingTarget | undefined> {
    const row: GradeFeedbackTargetRow | null = await this._prisma.gradeFeedback.findUnique({
      where: { id: feedbackId },
      select: { status: true, attemptId: true, attempt: { select: { userId: true, gradePublishedAt: true } } },
    });

    if (!row || row.status !== "READY" || !row.attempt.gradePublishedAt) {
      return undefined;
    }

    const call: AiCallSummary | undefined = await this._aiTelemetryFacade.getLatestCallByRef(GRADE_FEEDBACK_CALL_REF_TYPE, row.attemptId);

    return { recipientUserId: row.attempt.userId, aiCallId: call?.id };
  }

  private async _resolveMessage(messageId: string): Promise<RatingTarget | undefined> {
    const row: MessageTargetRow | null = await this._prisma.aiMessage.findUnique({
      where: { id: messageId },
      select: { role: true, aiCallId: true, conversation: { select: { userId: true } } },
    });

    if (!row || row.role !== "ASSISTANT") {
      return undefined;
    }

    return { recipientUserId: row.conversation.userId, aiCallId: row.aiCallId ?? undefined };
  }

  private async _resolveNotesAnalysis(aiCallId: string): Promise<RatingTarget | undefined> {
    const call: AiCallSummary | undefined = await this._aiTelemetryFacade.getCallById(aiCallId);

    if (!call || call.useCase !== "NOTES_ANALYSIS" || !call.userId) {
      return undefined;
    }

    return { recipientUserId: call.userId, aiCallId: call.id };
  }
}
