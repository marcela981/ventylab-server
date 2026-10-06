/*
 * Funcionalidad: Entidad AiRating
 * Descripción: Valoración de un usuario sobre una salida de IA concreta (tipo de objetivo e identificador), única por (usuario, tipo de objetivo, objetivo) y editable: conserva su identidad y fecha de creación al responder de nuevo; enlaza opcionalmente la llamada de IA que produjo la salida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { generateId } from "@/common/domain/utils/generate-id";
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { type AiRatingAnswers } from "@/features/ai-ratings/domain/value-objects/ai-rating-answers";

interface AiRatingProps {
  id: string;
  userId: string;
  targetType: AiRatingTargetTypeValue;
  targetId: string;
  aiCallId?: string;
  answers: AiRatingAnswers;
  createdAt: Date;
  updatedAt: Date;
}

export class AiRating extends AggregateRoot {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _targetType: AiRatingTargetTypeValue;
  private readonly _targetId: string;
  private _aiCallId?: string;
  private _answers: AiRatingAnswers;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: AiRatingProps) {
    super();
    this._id = props.id;
    this._userId = props.userId;
    this._targetType = props.targetType;
    this._targetId = props.targetId;
    this._aiCallId = props.aiCallId;
    this._answers = props.answers;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create({
    userId,
    targetType,
    targetId,
    aiCallId,
    answers,
  }: {
    userId: string;
    targetType: AiRatingTargetTypeValue;
    targetId: string;
    aiCallId?: string;
    answers: AiRatingAnswers;
  }): AiRating {
    const now: Date = new Date();

    return new AiRating({ id: generateId(), userId, targetType, targetId, aiCallId, answers, createdAt: now, updatedAt: now });
  }

  public static reconstitute(props: AiRatingProps): AiRating {
    return new AiRating(props);
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get targetType(): AiRatingTargetTypeValue {
    return this._targetType;
  }

  public get targetId(): string {
    return this._targetId;
  }

  public get aiCallId(): string | undefined {
    return this._aiCallId;
  }

  public get answers(): AiRatingAnswers {
    return this._answers;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public answer(answers: AiRatingAnswers, aiCallId: string | undefined): void {
    this._answers = answers;
    this._aiCallId = aiCallId;
    this._updatedAt = new Date();
  }
}
