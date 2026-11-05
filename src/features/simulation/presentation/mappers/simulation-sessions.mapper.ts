/*
 * Funcionalidad: Mapper de presentación de sesiones de simulación
 * Descripción: Convierte los resultados de los casos de uso de sesiones con eventos (inicio, lote de eventos, estado, resumen, repetición, listado y prueba de caso) en sus DTOs de respuesta con fechas ISO y null para valores ausentes; el formulario guardado del paciente propio (no sus ajustes internos) en el estado, la repetición y el listado
 * Versión: 1.4 (resultados de EXAM retenidos para el estudiante hasta la liberación docente)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AppendSimulationEventsResult,
  type ClinicalCaseTestRunResult,
  type SimulationSessionReplayResult,
  type SimulationSessionStateResult,
  type SimulationSessionSummaryResult,
  type StartSimulationSessionResult,
} from "@/features/simulation/application/results/simulation-session.results";
import { FULL_RESULTS_VISIBILITY, type ResultsVisibility } from "@/features/simulation/application/services/simulation-results-visibility.service";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";
import {
  type SimulationEventRecord,
  type SimulationSessionView,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { type DebriefTimelineItem, type SettingChange } from "@/features/simulation/domain/sessions/simulation-session-debrief";
import { SimulatedPatientDTO, SimulatedPatientVitalsDTO } from "@/features/simulation/presentation/dtos/simulation-session-request.dto";
import {
  AppendedSimulationEventsDTO,
  ClinicalCaseTestRunDTO,
  SimulationEventDTO,
  SimulationSessionDTO,
  SimulationSessionReplayDTO,
  SimulationSessionStateDTO,
  SimulationDebriefItemDTO,
  SimulationOutcomeDTO,
  SimulationSessionSummaryDTO,
  StartedSimulationSessionDTO,
} from "@/features/simulation/presentation/dtos/simulation-session.dto";

// EXAM students must not see target statuses before the teacher releases the answers, not even inside the metrics.
function withoutTargets<T extends object>(metrics: T): T {
  return { ...metrics, targets: [] };
}

export class SimulationSessionsResponseMapper {
  public static toStartedDTO(result: StartSimulationSessionResult): StartedSimulationSessionDTO {
    return new StartedSimulationSessionDTO({
      id: result.session.id,
      seed: result.session.seed,
      engineVersion: result.session.engineVersion,
      timeMultiplier: result.session.timeMultiplier,
      startedAt: result.session.startedAt.toISOString(),
      expiresAt: result.expiresAt?.toISOString() ?? null,
      case: result.engineCase,
    });
  }

  public static toAppendedDTO(result: AppendSimulationEventsResult): AppendedSimulationEventsDTO {
    return new AppendedSimulationEventsDTO({ accepted: result.accepted, duplicates: result.duplicates, lastSimTimeMs: result.lastSimTimeMs });
  }

  public static toStateDTO(result: SimulationSessionStateResult, visibility: ResultsVisibility = FULL_RESULTS_VISIBILITY): SimulationSessionStateDTO {
    return new SimulationSessionStateDTO({
      id: result.session.id,
      status: result.session.status,
      simTimeMs: result.simTimeMs,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      settings: result.settings,
      metrics: visibility.correction ? result.metrics : withoutTargets(result.metrics),
      alarms: [...result.alarms],
      targets: visibility.correction ? [...result.targets] : [],
      resultsWithheld: !visibility.correction,
      patient: SimulationSessionsResponseMapper.toPatientDTO(result.session),
    });
  }

  public static toSummaryDTO(result: SimulationSessionSummaryResult, visibility: ResultsVisibility = FULL_RESULTS_VISIBILITY): SimulationSessionSummaryDTO {
    const { correction } = visibility;

    return new SimulationSessionSummaryDTO({
      id: result.session.id,
      status: result.session.status,
      engineVersion: result.summary.engineVersion,
      simTimeMs: result.summary.simTimeMs,
      durationMs: result.summary.durationMs,
      finalMetrics: correction ? result.summary.finalMetrics : withoutTargets(result.summary.finalMetrics),
      targets: correction ? [...result.summary.targets] : [],
      score: visibility.score ? result.summary.score : null,
      breakdown: correction ? [...result.summary.breakdown] : [],
      resultsWithheld: !visibility.score || !correction,
      aiHelpCount: result.summary.aiHelpCount,
      outcome: correction && result.summary.outcome ? new SimulationOutcomeDTO({ ...result.summary.outcome }) : null,
      timeline: (correction ? (result.summary.timeline ?? []) : []).map(
        (item: DebriefTimelineItem): SimulationDebriefItemDTO => ({
          simTimeMs: item.simTimeMs,
          kind: item.kind,
          ...(item.code === undefined ? {} : { code: item.code }),
          ...(item.changes === undefined ? {} : { changes: item.changes.map((change: SettingChange) => ({ ...change })) }),
        }),
      ),
    });
  }

  public static toReplayDTO(result: SimulationSessionReplayResult, warning: string | null): SimulationSessionReplayDTO {
    return new SimulationSessionReplayDTO({
      id: result.session.id,
      case: result.engineCase,
      seed: result.session.seed,
      events: result.events.map(
        (event: SimulationEventRecord): SimulationEventDTO =>
          new SimulationEventDTO({
            id: event.id,
            simTimeMs: event.simTimeMs,
            type: event.type,
            payload: event.payload,
            receivedAt: event.receivedAt.toISOString(),
          }),
      ),
      engineVersion: result.session.engineVersion,
      timeMultiplier: result.session.timeMultiplier,
      currentEngineVersion: result.currentEngineVersion,
      engineVersionMismatch: result.engineVersionMismatch,
      warning,
      patient: SimulationSessionsResponseMapper.toPatientDTO(result.session),
    });
  }

  public static toSessionDTO(session: SimulationSession, caseTitle?: string, visibility: ResultsVisibility = FULL_RESULTS_VISIBILITY): SimulationSessionDTO {
    const view: SimulationSessionView = SimulationFacade.toView(session);

    return new SimulationSessionDTO({
      id: view.id,
      userId: view.userId,
      caseId: view.caseId,
      caseTitle: caseTitle ?? null,
      mode: view.mode,
      attemptId: view.attemptId ?? null,
      questionId: view.questionId ?? null,
      engineVersion: view.engineVersion,
      timeMultiplier: view.timeMultiplier,
      status: view.status,
      startedAt: view.startedAt.toISOString(),
      endedAt: view.endedAt?.toISOString() ?? null,
      lastEventAt: view.lastEventAt.toISOString(),
      lastSimTimeMs: view.lastSimTimeMs,
      score: visibility.score ? (view.score ?? null) : null,
      patient: SimulationSessionsResponseMapper.toPatientDTO(session),
    });
  }

  /** The stored form only: the resolved engine overrides stay internal */
  public static toPatientDTO(session: SimulationSession): SimulatedPatientDTO | null {
    const form: SimulatedPatient | undefined = session.patientProfile?.form;

    if (!form) {
      return null;
    }

    return Object.assign(new SimulatedPatientDTO(), {
      ...form,
      allergies: form.allergies === undefined ? undefined : [...form.allergies],
      history: form.history === undefined ? undefined : [...form.history],
      vitals: Object.assign(new SimulatedPatientVitalsDTO(), form.vitals),
    });
  }

  public static toTestRunDTO(result: ClinicalCaseTestRunResult): ClinicalCaseTestRunDTO {
    return new ClinicalCaseTestRunDTO({
      engineVersion: result.engineVersion,
      seconds: result.seconds,
      seed: result.seed,
      metricsTimeline: [...result.metricsTimeline],
    });
  }
}
