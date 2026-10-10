/*
 * Funcionalidad: Titular de la reserva
 * Descripción: Value object del titular de una reserva: un usuario o un grupo, con su tipo (USER o GROUP) y la conversión desde la persistencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";
import { InvalidReservationHolderError } from "@/features/reservations/domain/reservations.errors";

export type ReservationHolderTypeValue = "USER" | "GROUP";

export const USER_HOLDER_TYPE: ReservationHolderTypeValue = "USER";
export const GROUP_HOLDER_TYPE: ReservationHolderTypeValue = "GROUP";

export const RESERVATION_HOLDER_TYPE_VALUES: readonly ReservationHolderTypeValue[] = [USER_HOLDER_TYPE, GROUP_HOLDER_TYPE] as const;

export interface ReservationHolderSnapshot {
  readonly type: ReservationHolderTypeValue;
  readonly userId?: string;
  readonly groupId?: string;
}

export class ReservationHolder {
  private readonly _type: ReservationHolderTypeValue;
  private readonly _id: string;

  private constructor(type: ReservationHolderTypeValue, id: string) {
    this._type = type;
    this._id = id;
  }

  public get type(): ReservationHolderTypeValue {
    return this._type;
  }

  public get userId(): string | undefined {
    return this._type === USER_HOLDER_TYPE ? this._id : undefined;
  }

  public get groupId(): string | undefined {
    return this._type === GROUP_HOLDER_TYPE ? this._id : undefined;
  }

  public static forUser(userId: string): ReservationHolder {
    return new ReservationHolder(USER_HOLDER_TYPE, userId);
  }

  public static forGroup(groupId: string): ReservationHolder {
    return new ReservationHolder(GROUP_HOLDER_TYPE, groupId);
  }

  public static create({ type, userId, groupId }: { type: string; userId?: string; groupId?: string }): ReservationHolder {
    if (!RESERVATION_HOLDER_TYPE_VALUES.includes(type as ReservationHolderTypeValue)) {
      throw new InvalidValueObjectError("ReservationHolderType", type);
    }

    if (type === USER_HOLDER_TYPE && userId) {
      return ReservationHolder.forUser(userId);
    }

    if (type === GROUP_HOLDER_TYPE && groupId) {
      return ReservationHolder.forGroup(groupId);
    }

    throw new InvalidReservationHolderError();
  }

  public isUser(): boolean {
    return this._type === USER_HOLDER_TYPE;
  }

  public isGroup(): boolean {
    return this._type === GROUP_HOLDER_TYPE;
  }

  public toSnapshot(): ReservationHolderSnapshot {
    return { type: this._type, userId: this.userId, groupId: this.groupId };
  }

  public equals(other: ReservationHolder): boolean {
    return this._type === other._type && this._id === other._id;
  }
}
