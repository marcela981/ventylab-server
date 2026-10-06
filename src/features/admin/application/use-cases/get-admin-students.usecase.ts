/*
 * Funcionalidad: Caso de uso GetAdminStudentsUseCase
 * Descripción: Lista paginada de estudiantes con avance promedio, módulos completados, última actividad y grupo, filtrable por grupo, por grupos del profesor o por texto y ordenable por nombre, correo, última actividad o avance
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type AdminStudentListItem, type GetAdminStudentsQuery } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  ADMIN_DASHBOARD_REPOSITORY_TOKEN,
  type IAdminDashboardRepository,
} from "@/features/admin/domain/repositories/admin-dashboard.repository";

@Injectable()
export class GetAdminStudentsUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
  ) {}

  public async execute(query: GetAdminStudentsQuery): Promise<Paginated<AdminStudentListItem>> {
    return await this._adminDashboardRepository.getStudents(query);
  }
}
