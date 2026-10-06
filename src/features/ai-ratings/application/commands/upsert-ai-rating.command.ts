/*
 * Funcionalidad: Comando UpsertAiRatingCommand
 * Descripción: Intención de un usuario de crear o editar su valoración de una salida de IA: objetivo, aiCallId opcional enviado por el cliente, útil, comentario y escalas Likert QUEST opcionales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export class UpsertAiRatingCommand {
  public readonly userId: string;
  public readonly targetType: AiRatingTargetTypeValue;
  public readonly targetId: string;
  public readonly aiCallId?: string;
  public readonly helpful: boolean;
  public readonly comment?: string;
  public readonly quality?: number;
  public readonly understanding?: number;
  public readonly expression?: number;
  public readonly safety?: number;
  public readonly trust?: number;

  public constructor({
    userId,
    targetType,
    targetId,
    aiCallId,
    helpful,
    comment,
    quality,
    understanding,
    expression,
    safety,
    trust,
  }: {
    userId: string;
    targetType: AiRatingTargetTypeValue;
    targetId: string;
    aiCallId?: string;
    helpful: boolean;
    comment?: string;
    quality?: number;
    understanding?: number;
    expression?: number;
    safety?: number;
    trust?: number;
  }) {
    this.userId = userId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.aiCallId = aiCallId;
    this.helpful = helpful;
    this.comment = comment;
    this.quality = quality;
    this.understanding = understanding;
    this.expression = expression;
    this.safety = safety;
    this.trust = trust;
  }
}
