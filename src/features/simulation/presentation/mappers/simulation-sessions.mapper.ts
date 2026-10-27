/*
 * Funcionalidad: Mapper de presentación de sesiones de simulación
 * Descripción: Convierte los resultados de los casos de uso de sesiones con eventos (inicio, lote de eventos, estado, resumen, repetición, listado y prueba de caso) en sus DTOs de respuesta con fechas ISO y null para valores ausentes; el formulario guardado del paciente propio (no sus ajustes internos) en el estado, la repetición y el listado
 * Versión: 1.2
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
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";
import {
  type SimulationEventRecord,
  type SimulationSessionView,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { SimulatedPatientDTO, SimulatedPatientVitalsDTO } from "@/features/simulation/presentation/dtos/simulation-session-request.dto";
import {
  AppendedSimulationEventsDTO,
  ClinicalCaseTestRunDTO,
  SimulationEventDTO,
  SimulationSessionDTO,
  SimulationSessionReplayDTO,
  SimulationSessionStateDTO,
  SimulationSessionSummaryDTO,
  StartedSimulationSessionDTO,
} from "@/features/simulation/presentation/dtos/simulation-session.dto";

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

  public static toStateDTO(result: SimulationSessionStateResult): SimulationSessionStateDTO {
    return new SimulationSessionStateDTO({
      id: result.session.id,
      status: result.session.status,
      simTimeMs: result.simTimeMs,
      expiresAt: result.expiresAt?.toISOString() ?? null,
      settings: result.settings,
      metrics: result.metrics,
      alarms: [...result.alarms],
      targets: [...result.targets],
      patient: SimulationSessionsResponseMapper.toPatientDTO(result.session),
    });
  }

  public static toSummaryDTO(result: SimulationSessionSummaryResult): SimulationSessionSummaryDTO {
    return new SimulationSessionSummaryDTO({
      id: result.session.id,
      status: result.session.status,
      engineVersion: result.summary.engineVersion,
      simTimeMs: result.summary.simTimeMs,
      durationMs: result.summary.durationMs,
      finalMetrics: result.summary.finalMetrics,
      targets: [...result.summary.targets],
      score: result.summary.score,
      breakdown: [...result.summary.breakdown],
      aiHelpCount: result.summary.aiHelpCount,
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

  public static toSessionDTO(session: SimulationSession, caseTitle?: string): SimulationSessionDTO {
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
      score: view.score ?? null,
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
