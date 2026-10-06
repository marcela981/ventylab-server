/*
 * Funcionalidad: Clase base DomainEvent
 * Descripción: Base de los eventos de dominio con fecha de ocurrencia y autor de la operación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";

export abstract class DomainEvent {
  public readonly id: string;

  public readonly occurredAt: Date;

  public readonly performedBy?: string;

  public constructor({ performedBy }: { performedBy?: string } = {}) {
    this.id = generateId();
    this.occurredAt = new Date();
    this.performedBy = performedBy;
  }
}
