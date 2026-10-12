/*
 * Funcionalidad: Caso de uso ExportResearchDatasetUseCase
 * Descripción: Conjunto de datos anonimizado para el análisis de la tesis (capítulo 4): toma los estudiantes de los grupos STUDENT (todos o uno), lee sus datos con una llamada por lotes a cada fachada y produce filas largas (participante, grupo, dominio, ítem, métrica, valor) de progreso, notas, simulación, valoraciones y telemetría de IA, con los identificadores de usuario y grupo reemplazados por HMAC-SHA256 con la sal de exportación y sin nombres, correos ni identificadores originales; sin sal configurada no exporta nada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IPseudonymizer, PSEUDONYMIZER_TOKEN } from "@/features/analytics/application/ports/pseudonymizer.interface";
import { type ResearchDatasetRow } from "@/features/analytics/application/results/analytics.results";
import { StudentAnalyticsSourcesReader } from "@/features/analytics/application/services/student-analytics-sources.reader";
import { buildResearchRows, type ResearchParticipant, type StudentAnalyticsSources } from "@/features/analytics/application/services/student-analytics.builder";
import { AnalyticsExportNotConfiguredError } from "@/features/analytics/domain/analytics.errors";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type StudentMembershipView } from "@/features/groups/domain/repositories/group-analytics.repository";

/**
 * @throws {AnalyticsExportNotConfiguredError} If ANALYTICS_EXPORT_SALT is not configured
 */
@Injectable()
export class ExportResearchDatasetUseCase {
  public constructor(
    @Inject(PSEUDONYMIZER_TOKEN)
    private readonly _pseudonymizer: IPseudonymizer,
    private readonly _groupsFacade: GroupsFacade,
    private readonly _sourcesReader: StudentAnalyticsSourcesReader,
  ) {}

  public async execute(groupId?: string): Promise<ResearchDatasetRow[]> {
    if (!this._pseudonymizer.isConfigured) {
      throw new AnalyticsExportNotConfiguredError();
    }

    const memberships: StudentMembershipView[] = await this._groupsFacade.getStudentMemberships(groupId);
    const participants: ResearchParticipant[] = [];
    const seen: Set<string> = new Set<string>();

    // A student in several groups is exported once, under the first group in identifier order
    for (const membership of memberships) {
      if (!seen.has(membership.userId)) {
        seen.add(membership.userId);
        participants.push({ userId: membership.userId, groupId: membership.groupId });
      }
    }

    const sources: StudentAnalyticsSources = await this._sourcesReader.read(
      participants.map((participant: ResearchParticipant) => participant.userId),
      new Date(),
    );

    return buildResearchRows(participants, sources, (value: string) => this._pseudonymizer.pseudonymize(value));
  }
}
