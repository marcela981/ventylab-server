/*
 * Funcionalidad: Puerto IRatingTargetResolver
 * Descripción: Resuelve el objetivo de una valoración de IA (tipo e identificador) al usuario que recibió la salida y, cuando se conoce, a la llamada de IA que la produjo; devuelve undefined si el objetivo no existe o el usuario aún no puede verlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export const RATING_TARGET_RESOLVER_TOKEN: unique symbol = Symbol("RATING_TARGET_RESOLVER_TOKEN");

export interface RatingTarget {
  readonly recipientUserId: string;
  readonly aiCallId?: string;
}

export interface IRatingTargetResolver {
  resolve(targetType: AiRatingTargetTypeValue, targetId: string): Promise<RatingTarget | undefined>;
}
