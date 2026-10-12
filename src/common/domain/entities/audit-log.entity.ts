/*
 * Funcionalidad: Entidad AuditLog
 * Descripción: Representa un registro de auditoría con entidad afectada, acción, autor y su rol, estado anterior y posterior, motivo, metadatos y, cuando se indican explícitamente, el identificador de petición y la IP de origen
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";

export interface AuditLogProps<Action extends string = string> {
  readonly id: string;
  readonly action: Action;
  readonly description?: string;
  readonly performedByUserId?: string;
  readonly performedAt: Date;
  readonly metadata?: Record<string, unknown>;
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
  readonly reason?: string;
  readonly actorRole?: string;
  readonly requestId?: string;
  readonly ip?: string;
}

export type CreateAuditLogInput<Action extends string = string> = Omit<AuditLogProps<Action>, "id" | "performedAt">;

export class AuditLog<Action extends string = string> {
  private readonly _props: AuditLogProps<Action>;

  private constructor(props: AuditLogProps<Action>) {
    this._props = props;
  }

  public get id(): string {
    return this._props.id;
  }

  public get action(): Action {
    return this._props.action;
  }

  public get description(): string | undefined {
    return this._props.description;
  }

  public get performedByUserId(): string | undefined {
    return this._props.performedByUserId;
  }

  public get performedAt(): Date {
    return this._props.performedAt;
  }

  public get metadata(): Record<string, unknown> | undefined {
    return this._props.metadata;
  }

  public get before(): Record<string, unknown> | undefined {
    return this._props.before;
  }

  public get after(): Record<string, unknown> | undefined {
    return this._props.after;
  }

  public get reason(): string | undefined {
    return this._props.reason;
  }

  public get actorRole(): string | undefined {
    return this._props.actorRole;
  }

  public get requestId(): string | undefined {
    return this._props.requestId;
  }

  public get ip(): string | undefined {
    return this._props.ip;
  }

  public static create<Action extends string = string>(input: CreateAuditLogInput<Action>): AuditLog<Action> {
    return new AuditLog<Action>({ ...input, id: generateId(), performedAt: new Date() });
  }
}
