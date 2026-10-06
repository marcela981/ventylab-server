/*
 * Funcionalidad: Errores de dominio de calificaciones
 * Descripción: Errores de la feature de calificaciones (calificación inexistente, no propia y puntaje fuera de rango) con sus claves i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class ScoreNotFoundError extends DomainError {
  public constructor() {
    super("Score not found", "scores.score_not_found");
  }
}

export class ScoreNotOwnedError extends DomainError {
  public constructor() {
    super("Only the teacher who created the score can delete it", "scores.score_not_owned");
  }
}

export class InvalidScorePointsError extends DomainError {
  public constructor(maxPoints: number) {
    super(`The score must be between 0 and ${maxPoints}`, "scores.points_out_of_range");
  }
}
