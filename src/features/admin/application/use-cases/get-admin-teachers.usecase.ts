/*
 * Funcionalidad: Caso de uso GetAdminTeachersUseCase
 * Descripción: Lista profesores y administradores ordenados por nombre, con sus grupos como profesor, estudiantes en esos grupos y grupos creados; admite búsqueda por nombre o correo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AdminTeacherItem } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  ADMIN_DASHBOARD_REPOSITORY_TOKEN,
  type IAdminDashboardRepository,
} from "@/features/admin/domain/repositories/admin-dashboard.repository";

@Injectable()
export class GetAdminTeachersUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
  ) {}

  public async execute(search?: string): Promise<AdminTeacherItem[]> {
    return await this._adminDashboardRepository.getTeachers(search);
  }
}
