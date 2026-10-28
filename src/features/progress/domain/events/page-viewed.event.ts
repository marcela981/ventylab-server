/*
 * Funcionalidad: Evento PageViewedEvent
 * Descripción: Evento de dominio publicado después de confirmar cada vista de página registrada por un usuario; firstView indica que la fila de PageProgress se creó con esta vista (primera vez que el usuario ve la página). Lo consumen otras features (por ejemplo, la gamificación, que registra PAGE_VIEWED en el registro de actividad solo con firstView) sin depender del caso de uso; occurredAt lo fija DomainEvent al construir el evento. v1.1: unifica el evento de la rama de gamificación (lessonId nulo para páginas sin lección; moduleId siempre presente porque toda página pertenece a un módulo)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

// occurredAt is inherited from DomainEvent (set when the event is built, right after the view is recorded).
export class PageViewedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly pageId: string;
  // Null for a page attached to the module but not to a lesson.
  public readonly lessonId: string | null;
  public readonly moduleId: string;
  public readonly firstView: boolean;

  public constructor({
    userId,
    pageId,
    lessonId,
    moduleId,
    firstView,
  }: {
    userId: string;
    pageId: string;
    lessonId: string | null;
    moduleId: string;
    firstView: boolean;
  }) {
    super({ performedBy: userId });
    this.userId = userId;
    this.pageId = pageId;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.firstView = firstView;
  }
}
