/*
 * Funcionalidad: Comando RenameAiConversation
 * Descripción: Datos para renombrar una conversación propia del tutor de IA: dueño, conversación y nuevo título
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RenameAiConversationCommand {
  public readonly userId: string;
  public readonly conversationId: string;
  public readonly title: string;

  public constructor({ userId, conversationId, title }: { userId: string; conversationId: string; title: string }) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.title = title;
  }
}
