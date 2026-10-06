/*
 * Funcionalidad: Eventos de dominio de la retroalimentación de calificación
 * Descripción: Evento de regeneración solicitada: lleva el intento y la fila PENDING reservada para que la generación corra de forma asíncrona fuera de la petición del docente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export class GradeFeedbackRegenerationRequestedEvent extends DomainEvent {
  public readonly attemptId: string;
  public readonly feedbackId: string;

  public constructor({ attemptId, feedbackId, performedBy }: { attemptId: string; feedbackId: string; performedBy?: string }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.feedbackId = feedbackId;
  }
}
