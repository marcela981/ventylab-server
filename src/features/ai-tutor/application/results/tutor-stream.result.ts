/*
 * Funcionalidad: Resultado de stream del tutor
 * Descripción: Eventos que produce una respuesta del tutor de IA (inicio con la conversación y el id del mensaje del asistente, emitido antes del primer fragmento para poder valorar una respuesta detenida, fragmentos de texto y cierre con id de llamada, id del mensaje y conversación) y el resultado que entrega un caso de uso tras validar, cargar y verificar la cuota, antes de llamar al modelo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface TutorStartEvent {
  readonly type: "start";
  readonly conversationId: string;
  readonly messageId: string;
}

export interface TutorDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface TutorDoneEvent {
  readonly type: "done";
  readonly aiCallId: string;
  readonly messageId: string;
  readonly conversationId: string;
}

export type TutorStreamEvent = TutorStartEvent | TutorDeltaEvent | TutorDoneEvent;

export class TutorStreamResult {
  public readonly conversationId: string;
  public readonly events: AsyncIterable<TutorStreamEvent>;

  public constructor({ conversationId, events }: { conversationId: string; events: AsyncIterable<TutorStreamEvent> }) {
    this.conversationId = conversationId;
    this.events = events;
  }
}
