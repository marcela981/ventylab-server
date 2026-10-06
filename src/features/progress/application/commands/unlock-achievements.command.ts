/*
 * Funcionalidad: Comando UnlockAchievementsCommand
 * Descripción: Datos para evaluar y desbloquear los logros de un usuario cuyas condiciones pertenecen a los tipos disparados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AchievementConditionType } from "@/features/progress/domain/services/achievement-catalog";

export class UnlockAchievementsCommand {
  public readonly userId: string;
  public readonly triggers: AchievementConditionType[];

  public constructor({ userId, triggers }: { userId: string; triggers: AchievementConditionType[] }) {
    this.userId = userId;
    this.triggers = triggers;
  }
}
