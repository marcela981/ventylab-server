/*
 * Funcionalidad: Objeto de valor change-log-stats
 * Descripción: Define los valores permitidos ChangeLogStats de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ChangeLogStats {
  public readonly totalChanges: number;
  public readonly byEntityType: Readonly<Record<string, number>>;
  public readonly byAction: Readonly<Record<string, number>>;

  public constructor({
    totalChanges,
    byEntityType,
    byAction,
  }: {
    totalChanges: number;
    byEntityType: Record<string, number>;
    byAction: Record<string, number>;
  }) {
    this.totalChanges = totalChanges;
    this.byEntityType = byEntityType;
    this.byAction = byAction;
  }
}
