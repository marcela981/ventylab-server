/*
 * Funcionalidad: Modelos de lectura de calificaciones
 * Descripción: Vista de una calificación con los datos básicos del estudiante calificado o del profesor que la asignó
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Score } from "@/features/scores/domain/entities/score.entity";

export interface ScorePersonView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface ScoreView {
  readonly score: Score;
  readonly student?: ScorePersonView;
  readonly grader?: ScorePersonView;
}
