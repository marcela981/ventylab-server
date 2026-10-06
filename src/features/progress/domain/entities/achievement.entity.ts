/*
 * Funcionalidad: Entidad Achievement
 * Descripción: Agregado de dominio de un logro desbloqueado por un usuario; publica AchievementUnlockedEvent y registra la auditoría al desbloquearse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { AchievementUnlockedEvent } from "@/features/progress/domain/events/achievement.events";

export const ACHIEVEMENT_ENTITY_COLLECTION: string = "achievements";
export const ACHIEVEMENT_ENTITY_TYPE: string = "achievement";

export type AchievementAuditAction = "achievement_unlocked";

export class Achievement extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _title: string;
  private _description?: string;
  private _icon?: string;
  private _unlockedAt: Date;
  private _auditLogs: AuditLog<AchievementAuditAction>[];

  private constructor({
    id,
    userId,
    title,
    description,
    icon,
    unlockedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    title: string;
    description?: string;
    icon?: string;
    unlockedAt: Date;
    auditLogs: AuditLog<AchievementAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._title = title;
    this._description = description;
    this._icon = icon;
    this._unlockedAt = unlockedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get icon(): string | undefined {
    return this._icon;
  }

  public get unlockedAt(): Date {
    return this._unlockedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<AchievementAuditAction>> {
    return this._auditLogs;
  }

  public static unlock({
    userId,
    title,
    description,
    icon,
    xpReward,
  }: {
    userId: string;
    title: string;
    description?: string;
    icon?: string;
    xpReward: number;
  }): Achievement {
    const achievement: Achievement = new Achievement({
      id: generateId(),
      userId,
      title,
      description,
      icon,
      unlockedAt: new Date(),
      auditLogs: [
        AuditLog.create({
          action: "achievement_unlocked",
          performedByUserId: userId,
          metadata: { title, xpReward },
        }),
      ],
    });

    achievement.publishEvent(new AchievementUnlockedEvent({ entity: achievement, xpReward, performedBy: userId }));

    return achievement;
  }

  public static reconstitute({
    id,
    userId,
    title,
    description,
    icon,
    unlockedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    title: string;
    description?: string;
    icon?: string;
    unlockedAt: Date;
    auditLogs: AuditLog<AchievementAuditAction>[];
  }): Achievement {
    return new Achievement({ id, userId, title, description, icon, unlockedAt, auditLogs });
  }
}
