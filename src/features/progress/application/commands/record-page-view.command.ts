/*
 * Funcionalidad: Comando RecordPageViewCommand
 * Descripción: Datos para registrar de forma idempotente la vista de una página por el usuario autenticado, indicando si el lector puede gestionar páginas (ve contenido no publicado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RecordPageViewCommand {
  public readonly userId: string;
  public readonly pageId: string;
  public readonly canManage: boolean;

  public constructor({ userId, pageId, canManage }: { userId: string; pageId: string; canManage: boolean }) {
    this.userId = userId;
    this.pageId = pageId;
    this.canManage = canManage;
  }
}
