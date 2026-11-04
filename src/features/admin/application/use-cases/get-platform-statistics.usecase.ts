/*
 * Funcionalidad: Caso de uso GetPlatformStatisticsUseCase
 * Descripción: Estadísticas de la plataforma (usuarios por rol, estudiantes activos en los últimos 30 días, grupos, contenido, evaluaciones, sesiones del simulador, avance promedio, tasa de finalización, lecciones completadas hoy (desde la medianoche de America/Bogota), actividad reciente y reserva activa del ventilador)
 * Versión: 1.1
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
import { buildPlatformStatistics, startOfBogotaDay } from "@/features/admin/domain/services/admin-dashboard-calculator";

const ACTIVE_STUDENT_WINDOW_MS: number = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class GetPlatformStatisticsUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
  ) {}

  public async execute(now: Date = new Date()): Promise<PlatformStatistics> {
    const counts: PlatformCounts = await this._adminDashboardRepository.getPlatformCounts(startOfBogotaDay(now), new Date(now.getTime() - ACTIVE_STUDENT_WINDOW_MS));

    return buildPlatformStatistics(counts, now);
  }
}
