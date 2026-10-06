/*
 * Funcionalidad: Entidad SimulatorSession
 * Descripción: Agregado de una sesión del simulador (ventilador real o paciente simulado) con el registro de parámetros y de lecturas; se abre al iniciar la práctica o se guarda ya completada, con bitácora de auditoría y evento de dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { SimulatorSessionCreatedEvent } from "@/features/simulation/domain/events/simulator-session.events";

export const SIMULATOR_SESSION_COLLECTION: string = "simulator_sessions";
export const SIMULATOR_SESSION_TYPE: string = "simulator_session";

export type SimulatorSessionAuditAction = "simulator_session_started" | "simulator_session_saved";

export class SimulatorSession extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _clinicalCaseId?: string;
  private _isRealVentilator: boolean;
  private _parametersLog: unknown[];
  private _ventilatorData: unknown[];
  private _notes?: string;
  private _startedAt: Date;
  private _completedAt?: Date;
  private _auditLogs: AuditLog<SimulatorSessionAuditAction>[];

  private constructor({
    id,
    userId,
    clinicalCaseId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    clinicalCaseId?: string;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes?: string;
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<SimulatorSessionAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._clinicalCaseId = clinicalCaseId;
    this._isRealVentilator = isRealVentilator;
    this._parametersLog = parametersLog;
    this._ventilatorData = ventilatorData;
    this._notes = notes;
    this._startedAt = startedAt;
    this._completedAt = completedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get clinicalCaseId(): string | undefined {
    return this._clinicalCaseId;
  }

  public get isRealVentilator(): boolean {
    return this._isRealVentilator;
  }

  public get parametersLog(): ReadonlyArray<unknown> {
    return this._parametersLog;
  }

  public get ventilatorData(): ReadonlyArray<unknown> {
    return this._ventilatorData;
  }

  public get notes(): string | undefined {
    return this._notes;
  }

  public get startedAt(): Date {
    return this._startedAt;
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<SimulatorSessionAuditAction>> {
    return this._auditLogs;
  }

  public static start({
    userId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    clinicalCaseId,
  }: {
    userId: string;
    isRealVentilator: boolean;
    parametersLog?: unknown[];
    ventilatorData?: unknown[];
    notes?: string;
    clinicalCaseId?: string;
  }): SimulatorSession {
    return SimulatorSession._open({
      userId,
      isRealVentilator,
      parametersLog: parametersLog ?? [],
      ventilatorData: ventilatorData ?? [],
      notes,
      clinicalCaseId,
      completedAt: undefined,
      action: "simulator_session_started",
    });
  }

  public static recordCompleted({
    userId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    clinicalCaseId,
  }: {
    userId: string;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes?: string;
    clinicalCaseId?: string;
  }): SimulatorSession {
    return SimulatorSession._open({
      userId,
      isRealVentilator,
      parametersLog,
      ventilatorData,
      notes,
      clinicalCaseId,
      completedAt: new Date(),
      action: "simulator_session_saved",
    });
  }

  public static reconstitute({
    id,
    userId,
    clinicalCaseId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    clinicalCaseId?: string;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes?: string;
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<SimulatorSessionAuditAction>[];
  }): SimulatorSession {
    return new SimulatorSession({
      id,
      userId,
      clinicalCaseId,
      isRealVentilator,
      parametersLog,
      ventilatorData,
      notes,
      startedAt,
      completedAt,
      auditLogs,
    });
  }

  private static _open({
    userId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    clinicalCaseId,
    completedAt,
    action,
  }: {
    userId: string;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes?: string;
    clinicalCaseId?: string;
    completedAt?: Date;
    action: SimulatorSessionAuditAction;
  }): SimulatorSession {
    const session: SimulatorSession = new SimulatorSession({
      id: generateId(),
      userId,
      clinicalCaseId,
      isRealVentilator,
      parametersLog,
      ventilatorData,
      notes,
      startedAt: new Date(),
      completedAt,
      auditLogs: [
        AuditLog.create({
          action,
          performedByUserId: userId,
          metadata: { isRealVentilator, clinicalCaseId },
        }),
      ],
    });

    session.publishEvent(new SimulatorSessionCreatedEvent({ entity: session, performedBy: userId }));

    return session;
  }
}
