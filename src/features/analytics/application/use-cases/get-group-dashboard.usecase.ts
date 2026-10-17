/*
 * Funcionalidad: Caso de uso GetGroupDashboardUseCase
 * Descripción: Arma el panel de un grupo para su profesor o un administrador: verifica el alcance en cada petición con el grupo ya leído y, con caché de 60 s por grupo, solicitante y grupos en alcance, lee los miembros estudiantes con una consulta y los datos de todos ellos con una llamada por lotes a cada fachada (para un profesor, las notas solo de intentos de asignaciones de sus grupos o sin asignación de evaluaciones que creó), y combina una fila por estudiante en memoria con su riesgo según la nota aprobatoria y los umbrales vigentes (leídos en cada petición y parte de la clave de caché), más el progreso agregado por módulo del grupo
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ANALYTICS_SETTINGS_TOKEN, type AnalyticsSettings } from "@/features/analytics/application/ports/analytics-settings.interface";
import { type GroupDashboard, type StudentDashboardRow } from "@/features/analytics/application/results/analytics.results";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { type AnalyticsActor, AnalyticsScopeService, type ScopedGroup } from "@/features/analytics/application/services/analytics-scope.service";
import { StudentAnalyticsSourcesReader } from "@/features/analytics/application/services/student-analytics-sources.reader";
import { buildModuleSummary, buildStudentDashboardRows, type StudentAnalyticsSources } from "@/features/analytics/application/services/student-analytics.builder";
import { type GroupMemberSummary, GroupsFacade } from "@/features/groups/application/services/groups.facade";

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
    @Inject(ANALYTICS_SETTINGS_TOKEN)
    private readonly _settings: AnalyticsSettings,
  ) {}

  public async execute(actor: AnalyticsActor, groupId: string): Promise<GroupDashboard> {
    const scoped: ScopedGroup = await this._scope.assertGroupInScope(actor, groupId);
    const settings: AnalyticsSettings = { passingGrade: this._settings.passingGrade, riskThresholds: { ...this._settings.riskThresholds } };
    const { maxFailedEvaluations, minProgressPct, inactivityDays } = settings.riskThresholds;
    const settingsKey: string = `${settings.passingGrade}:${maxFailedEvaluations}:${minProgressPct}:${inactivityDays}`;
    const key: string = `dashboard:${scoped.group.id}:${this._scope.scopeKey(actor, scoped.attemptScope)}:${settingsKey}`;

    return await this._cache.getOrLoad(key, () => this._build(scoped, settings));
  }

  private async _build({ group, attemptScope }: ScopedGroup, settings: AnalyticsSettings): Promise<GroupDashboard> {
    const now: Date = new Date();
    const members: GroupMemberSummary[] = await this._groupsFacade.getGroupMembers(group.id);
    const students: GroupMemberSummary[] = members.filter((member: GroupMemberSummary) => member.userRole === STUDENT_MEMBER_ROLE);
    const sources: StudentAnalyticsSources = await this._sourcesReader.read(
      students.map((student: GroupMemberSummary) => student.userId),
      now,
      attemptScope,
    );

    const rows: StudentDashboardRow[] = buildStudentDashboardRows(students, sources, settings.riskThresholds, now);

    return {
      groupId: group.id,
      groupName: group.name,
      generatedAt: now,
      passingGrade: settings.passingGrade,
      riskThresholds: settings.riskThresholds,
      moduleSummary: buildModuleSummary(rows),
      students: rows,
    };
  }
}
