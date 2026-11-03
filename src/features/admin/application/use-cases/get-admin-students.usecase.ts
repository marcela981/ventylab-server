/*
 * Funcionalidad: Caso de uso GetAdminStudentsUseCase
 * Descripción: Listado paginado de estudiantes del panel docente: filtra por búsqueda (nombre, correo o código), por grupo y, con myGroups, por los grupos STUDENT que el solicitante gestiona (página vacía si no gestiona ninguno); el avance sale de LearningProgressFacade (lecciones publicadas) y la última actividad del progreso por páginas; ordena por nombre o correo en la base y por progreso o última actividad en memoria antes de paginar; cada fila indica si el solicitante puede abrir el detalle (ADMIN siempre; docente si gestiona algún grupo del estudiante, incluidos los inactivos)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { Paginated } from "@/common/domain/utils/paginated";
import {
  type AdminStudentFilter,
  type AdminStudentListItem,
  type AdminStudentRow,
  type GetAdminStudentsQuery,
  type StudentProgressSnapshot,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import {
  ADMIN_DASHBOARD_REPOSITORY_TOKEN,
  type IAdminDashboardRepository,
} from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { sortStudentIdsByComputedField } from "@/features/admin/domain/services/admin-dashboard-calculator";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { isAdminActor } from "@/features/groups/domain/services/group-management-policy";
import { LearningProgressFacade, type UserLearningProgress } from "@/features/progress/application/services/learning-progress.facade";
import { type UserProgressLastActivity } from "@/features/progress/domain/repositories/progress-analytics.repository";

@Injectable()
export class GetAdminStudentsUseCase {
  public constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY_TOKEN)
    private readonly _adminDashboardRepository: IAdminDashboardRepository,
    private readonly _groupsFacade: GroupsFacade,
    private readonly _learningProgressFacade: LearningProgressFacade,
  ) {}

  public async execute(query: GetAdminStudentsQuery): Promise<Paginated<AdminStudentListItem>> {
    // undefined: the actor may open every student (administrator).
    const managedGroupIds: string[] | undefined = isAdminActor(query.actor) ? undefined : await this._groupsFacade.getManageableStudentGroupIds(query.actor);
    const groupIds: string[] | undefined = await this._resolveGroupFilter(query, managedGroupIds);

    if (groupIds !== undefined && groupIds.length === 0) {
      return GetAdminStudentsUseCase._emptyPage(query);
    }

    const filter: AdminStudentFilter = { search: query.search, groupIds };
    const skip: number = (query.page - 1) * query.limit;

    if (query.sortBy === "name" || query.sortBy === "email") {
      const [total, rows]: [number, AdminStudentRow[]] = await Promise.all([
        this._adminDashboardRepository.countStudents(filter),
        this._adminDashboardRepository.getStudentPage(filter, { sortBy: query.sortBy, sortOrder: query.sortOrder, skip, take: query.limit }),
      ]);
      const snapshots: Map<string, StudentProgressSnapshot> = await this._snapshotsOf(rows.map((row: AdminStudentRow) => row.id));

      return new Paginated({ items: rows.map((row: AdminStudentRow) => GetAdminStudentsUseCase._toItem(row, snapshots, managedGroupIds)), total, page: query.page, limit: query.limit });
    }

    const ids: string[] = await this._adminDashboardRepository.getStudentIds(filter);
    const snapshots: Map<string, StudentProgressSnapshot> = await this._snapshotsOf(ids);
    const pageIds: string[] = sortStudentIdsByComputedField(ids, snapshots, query.sortBy, query.sortOrder).slice(skip, skip + query.limit);
    const rows: AdminStudentRow[] = await this._adminDashboardRepository.getStudentRows(pageIds);

    return new Paginated({ items: rows.map((row: AdminStudentRow) => GetAdminStudentsUseCase._toItem(row, snapshots, managedGroupIds)), total: ids.length, page: query.page, limit: query.limit });
  }

  private async _resolveGroupFilter(query: GetAdminStudentsQuery, managedGroupIds: string[] | undefined): Promise<string[] | undefined> {
    const requested: string[] | undefined = query.groupId !== undefined ? [query.groupId] : undefined;

    if (!query.myGroups) {
      return requested;
    }

    // An administrator manages every STUDENT group.
    const mine: string[] = managedGroupIds ?? (await this._groupsFacade.getManageableStudentGroupIds(query.actor));

    return requested === undefined ? mine : requested.filter((groupId: string) => mine.includes(groupId));
  }

  private async _snapshotsOf(userIds: string[]): Promise<Map<string, StudentProgressSnapshot>> {
    if (userIds.length === 0) {
      return new Map<string, StudentProgressSnapshot>();
    }

    const [progress, lastActivity]: [UserLearningProgress[], UserProgressLastActivity[]] = await Promise.all([
      this._learningProgressFacade.getProgressForUsers(userIds),
      this._learningProgressFacade.getLastActivityForUsers(userIds),
    ]);
    const lastActivityByUser: Map<string, Date> = new Map(lastActivity.map((item: UserProgressLastActivity): [string, Date] => [item.userId, item.lastActivityAt]));

    return new Map(
      progress.map((item: UserLearningProgress): [string, StudentProgressSnapshot] => [
        item.userId,
        {
          overallProgress: item.report.overall.percentage,
          completedModules: item.report.modules.filter((module: UserLearningProgress["report"]["modules"][number]) => module.completed).length,
          totalModules: item.report.modules.length,
          lastActivity: lastActivityByUser.get(item.userId),
        },
      ]),
    );
  }

  private static _toItem(row: AdminStudentRow, snapshots: ReadonlyMap<string, StudentProgressSnapshot>, managedGroupIds: string[] | undefined): AdminStudentListItem {
    const snapshot: StudentProgressSnapshot = snapshots.get(row.id) ?? { overallProgress: 0, completedModules: 0, totalModules: 0 };

    return {
      ...snapshot,
      id: row.id,
      name: row.name,
      email: row.email,
      studentCode: row.studentCode,
      groupName: row.activeGroups[0]?.name,
      groups: row.activeGroups,
      canView: managedGroupIds === undefined || row.groupIds.some((groupId: string) => managedGroupIds.includes(groupId)),
    };
  }

  private static _emptyPage(query: GetAdminStudentsQuery): Paginated<AdminStudentListItem> {
    return new Paginated<AdminStudentListItem>({ items: [], total: 0, page: query.page, limit: query.limit });
  }
}
