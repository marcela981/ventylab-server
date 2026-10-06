/*
 * Funcionalidad: Repositorio de calificaciones
 * Descripción: Contrato de persistencia y lectura del agregado Score (búsqueda por ID o por la clave profesor, estudiante, tipo y elemento; calificaciones de un estudiante y las asignadas por un profesor)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Score } from "@/features/scores/domain/entities/score.entity";
import { type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { type ScoreEntityTypeValue } from "@/features/scores/domain/value-objects/score-entity-type";

export const SCORES_REPOSITORY_TOKEN: unique symbol = Symbol("SCORES_REPOSITORY_TOKEN");

export interface ScoreKey {
  graderId: string;
  userId: string;
  entityType: ScoreEntityTypeValue;
  entityId: string;
}

export interface IScoresRepository {
  getById(id: string, transaction?: unknown): Promise<Score | undefined>;
  getByKey(key: ScoreKey, transaction?: unknown): Promise<Score | undefined>;
  getStudentScores(userId: string, graderId?: string): Promise<ScoreView[]>;
  getGraderScores(graderId: string, userId?: string): Promise<ScoreView[]>;
  save(score: Score, transaction?: unknown): Promise<void>;
  delete(score: Score, transaction?: unknown): Promise<void>;
}
