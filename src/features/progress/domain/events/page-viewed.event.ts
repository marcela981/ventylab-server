/*
 * Funcionalidad: Evento PageViewedEvent
 * Descripción: Evento de dominio publicado tras confirmar el registro de la vista de una página; indica si fue la primera vista del usuario (firstView) y el instante en que ocurrió, con la lección y el módulo de la página cuando los tiene
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export class PageViewedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly pageId: string;
  public readonly lessonId: string | null;
  public readonly moduleId: string | null;
  public readonly firstView: boolean;
  public override readonly occurredAt: Date;

  public constructor({
    userId,
    pageId,
    lessonId,
    moduleId,
    firstView,
    occurredAt,
  }: {
    userId: string;
    pageId: string;
    lessonId: string | null;
    moduleId: string | null;
    firstView: boolean;
    occurredAt: Date;
  }) {
    super({ performedBy: userId });
    this.userId = userId;
    this.pageId = pageId;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.firstView = firstView;
    this.occurredAt = occurredAt;
  }
}
