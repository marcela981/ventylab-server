/*
 * Funcionalidad: Mapeador de gamificación
 * Descripción: Convierte las estadísticas de gamificación, los días de actividad y los elementos de la actividad reciente del dominio en sus DTOs de respuesta
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityDay, type GamificationStats, type RecentActivityItem } from "@/features/progress/domain/read-models/gamification.read-model";
import {
  ActivityCalendarDTO,
  ActivityDayDTO,
  GamificationStatsDTO,
  RecentActivityItemDTO,
} from "@/features/progress/presentation/dtos/gamification.dto";

export class GamificationMapper {
  public static toGamificationStatsDTO(stats: GamificationStats): GamificationStatsDTO {
    return new GamificationStatsDTO({
      xpTotal: stats.xpTotal,
      level: stats.level,
      xpIntoLevel: stats.xpIntoLevel,
      nextLevelXp: stats.nextLevelXp,
      streakDays: stats.streakDays,
      longestStreak: stats.longestStreak,
      xpToday: stats.xpToday,
    });
  }

  public static toActivityCalendarDTO(days: ActivityDay[]): ActivityCalendarDTO {
    return new ActivityCalendarDTO({ days: days.map((day: ActivityDay) => new ActivityDayDTO({ date: day.date, count: day.count, xp: day.xp })) });
  }

  public static toRecentActivityItemDTO(item: RecentActivityItem): RecentActivityItemDTO {
    return new RecentActivityItemDTO({
      id: item.id,
      kind: item.kind,
      refId: item.refId,
      xp: item.xp,
      occurredAt: item.occurredAt.toISOString(),
      title: item.title,
    });
  }
}
