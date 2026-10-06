/*
 * Funcionalidad: Eventos de dominio de logros
 * Descripción: Define AchievementUnlockedEvent, publicado cuando un usuario desbloquea un logro
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Achievement } from "@/features/progress/domain/entities/achievement.entity";

export class AchievementUnlockedEvent extends DomainEvent {
  public readonly entity: Achievement;
  public readonly xpReward: number;

  public constructor({ entity, xpReward, performedBy }: { entity: Achievement; xpReward: number; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.xpReward = xpReward;
  }
}
