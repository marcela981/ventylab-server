/*
 * Funcionalidad: Repositorio Prisma del registro de actividad
 * Descripción: Implementa ILearningActivityRepository sobre learning_activity_events y user_activity_days: cada inserción es una sola sentencia (INSERT … ON CONFLICT DO NOTHING RETURNING encadenado con el upsert del día), de modo que un evento repetido no suma XP ni cuenta el día dos veces aun con concurrencia; agrega totales, días activos, calendario por rango y actividad reciente con títulos por lotes; el relleno histórico convierte las fechas al día de America/Bogota en PostgreSQL y guarda su versión en app_settings
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type LearningActivityKind, Prisma } from "@prisma/client";

import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ActivityDay,
  type LearningActivityTotals,
  type NewLearningActivity,
  type RecentActivityItem,
} from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository, type LearningActivityBackfillOptions } from "@/features/progress/domain/repositories/learning-activity.repository";
import {
  ACTIVITY_TIME_ZONE,
  type LocalDate,
  localDateToUtcMidnight,
  utcMidnightToLocalDate,
} from "@/features/progress/domain/services/activity-calendar";
import { XP_PER_EVALUATION_PASSED, XP_PER_FIRST_PAGE_VIEW, XP_PER_LESSON, XP_PER_MODULE } from "@/features/progress/domain/services/gamification-rules";
import {
  ACHIEVEMENT_UNLOCKED_ACTIVITY,
  EVALUATION_PASSED_ACTIVITY,
  LESSON_COMPLETED_ACTIVITY,
  type LearningActivityKindValue,
  MODULE_COMPLETED_ACTIVITY,
  PAGE_VIEWED_ACTIVITY,
} from "@/features/progress/domain/value-objects/learning-activity-kind";

export const LEARNING_ACTIVITY_BACKFILL_SETTING_KEY: string = "learning_activity_backfill_version";

interface TitledRow {
  readonly id: string;
  readonly title: string;
}

interface DayGroupRow {
  readonly localDate: Date;
  readonly count: number;
  readonly xp: number;
}

/**
 * Inserts the ledger rows produced by `source` (columns user_id, kind, ref_id, xp, occurred_at, local_date) skipping duplicates,
 * and adds the inserted rows to their activity days in the same statement.
 */
function backfillStatement(source: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    WITH source AS (${source}),
    inserted AS (
      INSERT INTO learning_activity_events (id, user_id, kind, ref_id, xp, occurred_at, local_date)
      SELECT gen_random_uuid()::text, user_id, kind::"LearningActivityKind", ref_id, xp, occurred_at, local_date FROM source
      ON CONFLICT (user_id, kind, ref_id) DO NOTHING
      RETURNING user_id, local_date
    ),
    days AS (
      INSERT INTO user_activity_days (user_id, local_date, event_count)
      SELECT user_id, local_date, COUNT(*)::int FROM inserted GROUP BY user_id, local_date
      ON CONFLICT (user_id, local_date) DO UPDATE SET event_count = user_activity_days.event_count + EXCLUDED.event_count
    )
    SELECT COUNT(*)::int AS inserted FROM inserted`;
}

// Legacy Prisma DateTime columns are `timestamp(3)` holding UTC, so they are read as UTC before moving to the Bogota day.
function bogotaDateOfUtcTimestamp(column: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${ACTIVITY_TIME_ZONE}::text)::date`;
}

@Injectable()
export class LearningActivityPrismaRepository implements ILearningActivityRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async record(activity: NewLearningActivity, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const affected: number = await client.$executeRaw`
      WITH inserted AS (
        INSERT INTO learning_activity_events (id, user_id, kind, ref_id, xp, occurred_at, local_date)
        VALUES (${generateId()}, ${activity.userId}, ${activity.kind}::"LearningActivityKind", ${activity.refId}, ${activity.xp}::int, ${activity.occurredAt.toISOString()}::timestamptz, ${activity.localDate}::date)
        ON CONFLICT (user_id, kind, ref_id) DO NOTHING
        RETURNING user_id, local_date
      )
      INSERT INTO user_activity_days (user_id, local_date, event_count)
      SELECT user_id, local_date, 1 FROM inserted
      ON CONFLICT (user_id, local_date) DO UPDATE SET event_count = user_activity_days.event_count + 1`;

    return affected > 0;
  }

  public async getTotals(userId: string, today: LocalDate): Promise<LearningActivityTotals> {
    const [total, ofToday]: [{ _sum: { xp: number | null } }, { _sum: { xp: number | null } }] = await Promise.all([
      this._prisma.learningActivityEvent.aggregate({ where: { userId }, _sum: { xp: true } }),
      this._prisma.learningActivityEvent.aggregate({ where: { userId, localDate: localDateToUtcMidnight(today) }, _sum: { xp: true } }),
    ]);

    return { xpTotal: total._sum.xp ?? 0, xpToday: ofToday._sum.xp ?? 0 };
  }

  public async getActiveDates(userId: string): Promise<LocalDate[]> {
    const rows: { localDate: Date }[] = await this._prisma.userActivityDay.findMany({
      where: { userId, eventCount: { gt: 0 } },
      select: { localDate: true },
      orderBy: { localDate: "asc" },
    });

    return rows.map((row: { localDate: Date }) => utcMidnightToLocalDate(row.localDate));
  }

  public async getActivityDays(userId: string, from: LocalDate, to: LocalDate): Promise<ActivityDay[]> {
    const rows: DayGroupRow[] = await this._prisma.$queryRaw<DayGroupRow[]>`
      SELECT local_date AS "localDate", COUNT(*)::int AS count, COALESCE(SUM(xp), 0)::int AS xp
      FROM learning_activity_events
      WHERE user_id = ${userId} AND local_date BETWEEN ${from}::date AND ${to}::date
      GROUP BY local_date
      ORDER BY local_date ASC`;

    return rows.map((row: DayGroupRow): ActivityDay => ({ date: utcMidnightToLocalDate(row.localDate), count: row.count, xp: row.xp }));
  }

  public async getRecent(userId: string, kinds: readonly LearningActivityKindValue[], limit: number): Promise<RecentActivityItem[]> {
    const rows: { id: string; kind: LearningActivityKind; refId: string; xp: number; occurredAt: Date }[] = await this._prisma.learningActivityEvent.findMany({
      where: { userId, kind: { in: kinds as LearningActivityKind[] } },
      select: { id: true, kind: true, refId: true, xp: true, occurredAt: true },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    const titles: Map<string, string> = await this._loadTitles(userId, rows);

    return rows.map(
      (row: { id: string; kind: LearningActivityKind; refId: string; xp: number; occurredAt: Date }): RecentActivityItem => ({
        id: row.id,
        kind: row.kind,
        refId: row.refId,
        xp: row.xp,
        occurredAt: row.occurredAt,
        title: titles.get(`${row.kind}:${row.refId}`) ?? null,
      }),
    );
  }

  public async backfill({ passingGrade }: LearningActivityBackfillOptions): Promise<number> {
    const sources: Prisma.Sql[] = [
      Prisma.sql`
        SELECT "userId" AS user_id, ${PAGE_VIEWED_ACTIVITY}::text AS kind, "pageId" AS ref_id, ${XP_PER_FIRST_PAGE_VIEW}::int AS xp,
               ("createdAt" AT TIME ZONE 'UTC') AS occurred_at, ${bogotaDateOfUtcTimestamp(Prisma.sql`"createdAt"`)} AS local_date
        FROM page_progress`,
      Prisma.sql`
        SELECT "userId" AS user_id, ${LESSON_COMPLETED_ACTIVITY}::text AS kind, "lessonId" AS ref_id, ${XP_PER_LESSON}::int AS xp,
               ("completedAt" AT TIME ZONE 'UTC') AS occurred_at, ${bogotaDateOfUtcTimestamp(Prisma.sql`"completedAt"`)} AS local_date
        FROM lesson_completions WHERE "isCompleted" = true AND "completedAt" IS NOT NULL`,
      Prisma.sql`
        SELECT "userId" AS user_id, ${MODULE_COMPLETED_ACTIVITY}::text AS kind, "moduleId" AS ref_id, ${XP_PER_MODULE}::int AS xp,
               ("completedAt" AT TIME ZONE 'UTC') AS occurred_at, ${bogotaDateOfUtcTimestamp(Prisma.sql`"completedAt"`)} AS local_date
        FROM user_progress WHERE "isModuleCompleted" = true AND "completedAt" IS NOT NULL`,
      // First published passing attempt of each (student, evaluation), the same rule as EvaluationGradePublishedEvent.passed.
      Prisma.sql`
        SELECT DISTINCT ON (user_id, evaluation_id)
               user_id, ${EVALUATION_PASSED_ACTIVITY}::text AS kind, evaluation_id AS ref_id, ${XP_PER_EVALUATION_PASSED}::int AS xp,
               grade_published_at AS occurred_at, (grade_published_at AT TIME ZONE ${ACTIVITY_TIME_ZONE}::text)::date AS local_date
        FROM student_evaluation_attempts
        WHERE grade_published_at IS NOT NULL AND grade IS NOT NULL AND grade >= ${passingGrade}::float8
        ORDER BY user_id, evaluation_id, grade_published_at ASC`,
      Prisma.sql`
        SELECT "userId" AS user_id, ${ACHIEVEMENT_UNLOCKED_ACTIVITY}::text AS kind, id AS ref_id, 0 AS xp,
               ("unlockedAt" AT TIME ZONE 'UTC') AS occurred_at, ${bogotaDateOfUtcTimestamp(Prisma.sql`"unlockedAt"`)} AS local_date
        FROM achievements`,
    ];

    let inserted: number = 0;

    for (const source of sources) {
      const [row]: { inserted: number }[] = await this._prisma.$queryRaw<{ inserted: number }[]>(backfillStatement(source));

      inserted += row?.inserted ?? 0;
    }

    return inserted;
  }

  public async getBackfillVersion(): Promise<string | undefined> {
    const row: { value: string } | null = await this._prisma.appSetting.findUnique({ where: { key: LEARNING_ACTIVITY_BACKFILL_SETTING_KEY }, select: { value: true } });

    return row?.value;
  }

  public async setBackfillVersion(version: string): Promise<void> {
    await this._prisma.appSetting.upsert({
      where: { key: LEARNING_ACTIVITY_BACKFILL_SETTING_KEY },
      create: { key: LEARNING_ACTIVITY_BACKFILL_SETTING_KEY, value: version },
      update: { value: version },
    });
  }

  private async _loadTitles(userId: string, rows: { kind: LearningActivityKind; refId: string }[]): Promise<Map<string, string>> {
    const idsOf = (kind: LearningActivityKindValue): string[] => [...new Set(rows.filter((row: { kind: string }) => row.kind === kind).map((row: { refId: string }) => row.refId))];
    const lessonIds: string[] = idsOf(LESSON_COMPLETED_ACTIVITY);
    const moduleIds: string[] = idsOf(MODULE_COMPLETED_ACTIVITY);
    const evaluationIds: string[] = idsOf(EVALUATION_PASSED_ACTIVITY);
    const pageIds: string[] = idsOf(PAGE_VIEWED_ACTIVITY);
    const achievementRefs: string[] = idsOf(ACHIEVEMENT_UNLOCKED_ACTIVITY);
    const none: Promise<TitledRow[]> = Promise.resolve([]);

    const [lessons, modules, evaluations, pages, achievements]: TitledRow[][] = await Promise.all([
      lessonIds.length > 0 ? this._prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, title: true } }) : none,
      moduleIds.length > 0 ? this._prisma.module.findMany({ where: { id: { in: moduleIds } }, select: { id: true, title: true } }) : none,
      evaluationIds.length > 0 ? this._prisma.evaluation.findMany({ where: { id: { in: evaluationIds } }, select: { id: true, title: true } }) : none,
      pageIds.length > 0 ? this._prisma.page.findMany({ where: { id: { in: pageIds } }, select: { id: true, title: true } }) : none,
      achievementRefs.length > 0 ? this._prisma.achievement.findMany({ where: { userId, id: { in: achievementRefs } }, select: { id: true, title: true } }) : none,
    ]);

    const titles: Map<string, string> = new Map();
    const add = (kind: LearningActivityKindValue, items: TitledRow[]): void => items.forEach((item: TitledRow) => titles.set(`${kind}:${item.id}`, item.title));

    add(LESSON_COMPLETED_ACTIVITY, lessons);
    add(MODULE_COMPLETED_ACTIVITY, modules);
    add(EVALUATION_PASSED_ACTIVITY, evaluations);
    add(PAGE_VIEWED_ACTIVITY, pages);
    add(ACHIEVEMENT_UNLOCKED_ACTIVITY, achievements);

    return titles;
  }
}
