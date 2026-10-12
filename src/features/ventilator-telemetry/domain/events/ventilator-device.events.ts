/*
 * Funcionalidad: Eventos de conectividad del ventilador
 * Descripción: Eventos de dominio emitidos cuando el ventilador físico deja de enviar mensajes (inactivo o bróker desconectado) y cuando vuelve a enviarlos; se publican también bajo los nombres de catálogo ventilator.deviceOffline y ventilator.deviceOnline
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import {
  type CatalogDomainEvent,
  catalogMeta,
  type VentilatorDeviceOfflinePayload,
  type VentilatorDeviceOnlinePayload,
} from "@/common/domain/events/domain-event-catalog";

export class VentilatorDeviceOfflineEvent extends DomainEvent implements CatalogDomainEvent<"ventilator.deviceOffline"> {
  public readonly reason: string;
  public readonly lastMessageAt?: Date;

  public constructor({ reason, lastMessageAt }: { reason: string; lastMessageAt?: Date }) {
    super();
    this.reason = reason;
    this.lastMessageAt = lastMessageAt;
  }

  public get catalogName(): "ventilator.deviceOffline" {
    return "ventilator.deviceOffline";
  }

  public toCatalogPayload(): VentilatorDeviceOfflinePayload {
    return { ...catalogMeta(this), reason: this.reason, lastMessageAt: this.lastMessageAt };
  }
}

export class VentilatorDeviceOnlineEvent extends DomainEvent implements CatalogDomainEvent<"ventilator.deviceOnline"> {
  public readonly at: Date;

  public constructor({ at }: { at: Date }) {
    super();
    this.at = at;
  }

  public get catalogName(): "ventilator.deviceOnline" {
    return "ventilator.deviceOnline";
  }

  public toCatalogPayload(): VentilatorDeviceOnlinePayload {
    return { ...catalogMeta(this), at: this.at };
  }
}
