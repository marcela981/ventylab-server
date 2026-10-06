/*
 * Funcionalidad: Caso de uso GetAdminStudentProgressUseCase
 * Descripción: Detalle de un estudiante para el panel docente: perfil y grupos, avance por módulo, lecciones, intentos de casos clínicos y quizzes, sesiones del simulador, calificaciones y estadísticas; cuenta los logros con el repositorio exportado por la feature de progreso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type AdminStudentActivity,
  type AdminStudentProfile,
  type AdminStudentProgressDetail,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  ADMIN_DASHBOARD_REPOSITORY_TOKEN,
  type IAdminDashboardRepository,
} from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { computeStudentStatistics } from "@/features/admin/domain/services/admin-dashboard-calculator";
import { type Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { ACHIEVEMENTS_REPOSITORY_TOKEN, type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import { UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";
import { STUDENT_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

/**
 * @throws {UserNotFoundError} If the user does not exist
 * @throws {UserNotStudentError} If the user is not a student
 */
@Injectable()
export class GetAdminStudentProgressUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
    @Inject(ACHIEVEMENTS_REPOSITORY_TOKEN)
    private readonly _achievementsRepository: IAchievementsRepository,
  ) {}

  public async execute(studentId: string): Promise<AdminStudentProgressDetail> {
    const profile: AdminStudentProfile | undefined = await this._adminDashboardRepository.getStudentProfile(studentId);

    if (!profile) {
      throw new UserNotFoundError();
    }

    if (profile.role !== STUDENT_ROLE_VALUE) {
      throw new UserNotStudentError();
    }

    const [activity, achievements]: [AdminStudentActivity, Achievement[]] = await Promise.all([
      this._adminDashboardRepository.getStudentActivity(studentId),
      this._achievementsRepository.getByUserId(studentId),
    ]);

    return {
      user: profile,
      ...activity,
      statistics: computeStudentStatistics(activity, achievements.length),
    };
  }
}
