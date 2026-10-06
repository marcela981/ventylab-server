/*
 * Funcionalidad: Caso de uso GetPlatformStatisticsUseCase
 * Descripción: Estadísticas de la plataforma (usuarios por rol, estudiantes activos en los últimos 30 días, grupos, contenido, evaluaciones, sesiones del simulador, avance promedio, tasa de finalización, lecciones completadas hoy, actividad reciente y reserva activa del ventilador)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type PlatformCounts, type PlatformStatistics } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  ADMIN_DASHBOARD_REPOSITORY_TOKEN,
  type IAdminDashboardRepository,
} from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { buildPlatformStatistics } from "@/features/admin/domain/services/admin-dashboard-calculator";

const ACTIVE_STUDENT_WINDOW_DAYS: number = 30;

@Injectable()
export class GetPlatformStatisticsUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
  ) {}

  public async execute(): Promise<PlatformStatistics> {
    const todayStart: Date = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const activeSince: Date = new Date();

    activeSince.setDate(activeSince.getDate() - ACTIVE_STUDENT_WINDOW_DAYS);

    const counts: PlatformCounts = await this._adminDashboardRepository.getPlatformCounts(todayStart, activeSince);

    return buildPlatformStatistics(counts, new Date());
  }
}
