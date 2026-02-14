/**
 * @module ProgressService
 * @description Servicio de progreso del módulo teaching.
 * Gestiona el tracking de progreso de usuarios en módulos y lecciones.
 *
 * Responsabilidades:
 * - Consultar progreso global y por módulo
 * - Actualizar progreso al completar lecciones
 * - Recalcular porcentajes de módulo al completar lecciones
 * - Marcar módulos como completados cuando todas las lecciones están listas
 * - Gestionar registros de LessonCompletion (quiz scores, case completion)
 *
 * Nota: Coexiste con el sistema legacy en src/services/progress/.
 * Este servicio opera sobre UserProgress + LessonCompletion (System 2).
 */

import type { PrismaClient } from '@prisma/client';
import type {
  UserProgress,
  LessonCompletion,
  GetProgressRequest,
  GetProgressResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetLessonCompletionRequest,
  GetLessonCompletionResponse,
} from '../../../contracts/teaching.contracts';
import { ProgressStatus } from '../../../contracts/teaching.contracts';

export class ProgressService {
  constructor(private readonly prisma: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // User Progress (module-level)
  // ---------------------------------------------------------------------------

  /**
   * Obtiene el progreso de un usuario, opcionalmente filtrado por nivel o módulo.
   * @param request - userId y filtros opcionales
   * @returns Registros de progreso y estadísticas globales
   */
  async getProgress(request: GetProgressRequest): Promise<GetProgressResponse> {
    // TODO: Consultar UserProgress por userId
    // TODO: Filtrar por levelId o moduleId si proporcionados
    // TODO: Calcular totalModules, completedModulesCount, inProgressModulesCount
    // TODO: Calcular overallProgressPercentage
    // TODO: Retornar GetProgressResponse
    throw new Error('Not implemented');
  }

  /**
   * Actualiza el progreso de un usuario en un módulo.
   * Si se proporciona lessonId, marca la lección como completada
   * y recalcula el progreso del módulo.
   * @param request - Datos de actualización
   * @returns Progreso actualizado
   */
  async updateProgress(request: UpdateProgressRequest): Promise<UpdateProgressResponse> {
    // TODO: Usar $transaction para atomicidad
    // TODO: Obtener o crear registro UserProgress
    // TODO: Si lessonId proporcionado, crear/actualizar LessonCompletion
    // TODO: Si incrementCompleted, incrementar completedLessonsCount
    // TODO: Recalcular progressPercentage
    // TODO: Si todas las lecciones completadas, marcar status = COMPLETED
    // TODO: Retornar progreso actualizado + moduleJustCompleted flag
    throw new Error('Not implemented');
  }

  /**
   * Marca un módulo como iniciado para un usuario.
   * Crea el registro UserProgress con status IN_PROGRESS si no existe.
   * @param userId - ID del usuario
   * @param moduleId - ID del módulo
   * @returns Progreso creado o existente
   */
  async startModule(userId: string, moduleId: string): Promise<UserProgress> {
    // TODO: Verificar que el módulo existe
    // TODO: Buscar UserProgress existente
    // TODO: Si no existe, crear con status = IN_PROGRESS
    // TODO: Calcular totalLessonsCount del módulo
    // TODO: Retornar UserProgress
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Lesson Completion
  // ---------------------------------------------------------------------------

  /**
   * Obtiene registros de completitud de lecciones de un usuario.
   * @param request - userId y filtros opcionales
   * @returns Registros de completitud
   */
  async getLessonCompletions(request: GetLessonCompletionRequest): Promise<GetLessonCompletionResponse> {
    // TODO: Consultar LessonCompletion por userId
    // TODO: Filtrar por moduleId o lessonId si proporcionados
    // TODO: Calcular totalLessons y completedLessonsCount
    // TODO: Retornar GetLessonCompletionResponse
    throw new Error('Not implemented');
  }

  /**
   * Marca una lección como completada.
   * Valida requisitos de quiz y caso clínico si aplica.
   * @param userId - ID del usuario
   * @param lessonId - ID de la lección
   * @param quizScore - Puntaje del quiz (requerido si hasRequiredQuiz)
   * @param caseCompleted - Si completó caso clínico (requerido si hasRequiredCase)
   * @returns Registro de completitud
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    quizScore?: number,
    caseCompleted?: boolean,
  ): Promise<LessonCompletion> {
    // TODO: Obtener Lesson para verificar hasRequiredQuiz y hasRequiredCase
    // TODO: Si hasRequiredQuiz y no quizScore, lanzar error
    // TODO: Si hasRequiredCase y no caseCompleted, lanzar error
    // TODO: Crear o actualizar LessonCompletion
    // TODO: Actualizar bestQuizScore si el nuevo score es mejor
    // TODO: Incrementar quizAttempts
    // TODO: Recalcular progreso del módulo padre
    // TODO: Retornar LessonCompletion
    throw new Error('Not implemented');
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Recalcula el porcentaje de progreso de un módulo para un usuario.
   * Se llama internamente después de cada completitud de lección.
   * @param userId - ID del usuario
   * @param moduleId - ID del módulo
   * @returns Progreso actualizado
   */
  private async recalculateModuleProgress(userId: string, moduleId: string): Promise<UserProgress> {
    // TODO: Contar total de lecciones del módulo
    // TODO: Contar lecciones completadas del usuario (LessonCompletion.completed = true)
    // TODO: Calcular porcentaje
    // TODO: Actualizar UserProgress con nuevos valores
    // TODO: Si 100%, marcar status = COMPLETED y set completedAt
    // TODO: Retornar UserProgress actualizado
    throw new Error('Not implemented');
  }

  /**
   * Verifica si un módulo fue recién completado (para notificaciones/logros).
   * @param userId - ID del usuario
   * @param moduleId - ID del módulo
   * @returns true si el módulo acaba de pasar a COMPLETED
   */
  private async checkModuleJustCompleted(userId: string, moduleId: string): Promise<boolean> {
    // TODO: Consultar UserProgress
    // TODO: Retornar true si status === COMPLETED y completedAt es reciente (< 1 min)
    throw new Error('Not implemented');
  }
}
