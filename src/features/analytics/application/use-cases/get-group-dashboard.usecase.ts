/*
 * Funcionalidad: Caso de uso GetGroupDashboardUseCase
 * Descripción: Arma el panel de un grupo para su profesor o un administrador: verifica el alcance en cada petición y, con caché de 60 s por grupo y solicitante, lee los miembros estudiantes con una consulta y los datos de todos ellos con una llamada por lotes a cada fachada, y combina una fila por estudiante en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type GroupDashboard } from "@/features/analytics/application/results/analytics.results";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { type AnalyticsActor, AnalyticsScopeService } from "@/features/analytics/application/services/analytics-scope.service";
import { StudentAnalyticsSourcesReader } from "@/features/analytics/application/services/student-analytics-sources.reader";
import { buildStudentDashboardRows, type StudentAnalyticsSources } from "@/features/analytics/application/services/student-analytics.builder";
import { type GroupMemberSummary, GroupsFacade, type GroupSummary } from "@/features/groups/application/services/groups.facade";

export const STUDENT_MEMBER_ROLE: string = "STUDENT";

/**
 * @throws {AnalyticsGroupNotFoundError} If the group does not exist
 * @throws {AnalyticsScopeForbiddenError} If the requester neither administers the platform nor manages the group
 */
@Injectable()
export class GetGroupDashboardUseCase {
  public constructor(
    private readonly _scope: AnalyticsScopeService,
    private readonly _cache: AnalyticsCache,
    private readonly _groupsFacade: GroupsFacade,
    private readonly _sourcesReader: StudentAnalyticsSourcesReader,
  ) {}

  public async execute(actor: AnalyticsActor, groupId: string): Promise<GroupDashboard> {
    const group: GroupSummary = await this._scope.assertGroupInScope(actor, groupId);

    return await this._cache.getOrLoad(`dashboard:${group.id}:${this._scope.scopeKey(actor)}`, () => this._build(group));
  }

  private async _build(group: GroupSummary): Promise<GroupDashboard> {
    const now: Date = new Date();
    const members: GroupMemberSummary[] = await this._groupsFacade.getGroupMembers(group.id);
    const students: GroupMemberSummary[] = members.filter((member: GroupMemberSummary) => member.userRole === STUDENT_MEMBER_ROLE);
    const sources: StudentAnalyticsSources = await this._sourcesReader.read(
      students.map((student: GroupMemberSummary) => student.userId),
      now,
    );

    return { groupId: group.id, groupName: group.name, generatedAt: now, students: buildStudentDashboardRows(students, sources) };
  }
}
