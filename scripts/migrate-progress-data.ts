/**
 * PROGRESS DATA MIGRATION SCRIPT
 *
 * This script migrates data from the deprecated Progress model
 * to the new LearningProgress + LessonProgress system.
 *
 * RUN THIS BEFORE REMOVING THE OLD PROGRESS MODEL.
 *
 * Usage:
 *   npx ts-node scripts/migrate-progress-data.ts
 *
 * Or with dry-run (no changes):
 *   DRY_RUN=true npx ts-node scripts/migrate-progress-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';

interface MigrationStats {
  oldProgressRecords: number;
  migratedModuleProgress: number;
  migratedLessonProgress: number;
  skippedNoLesson: number;
  skippedNoModule: number;
  skippedAlreadyExists: number;
  errors: string[];
}

async function migrateProgressData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    oldProgressRecords: 0,
    migratedModuleProgress: 0,
    migratedLessonProgress: 0,
    skippedNoLesson: 0,
    skippedNoModule: 0,
    skippedAlreadyExists: 0,
    errors: [],
  };

  console.log('========================================');
  console.log('PROGRESS DATA MIGRATION');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('========================================\n');

  try {
    // Step 1: Get all old Progress records
    const oldProgressRecords = await prisma.progress.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    stats.oldProgressRecords = oldProgressRecords.length;
    console.log(`Found ${stats.oldProgressRecords} old Progress records\n`);

    if (stats.oldProgressRecords === 0) {
      console.log('No old progress data to migrate.');
      return stats;
    }

    // Step 2: Group by user and module
    const userModuleMap = new Map<string, Map<string, typeof oldProgressRecords>>();

    for (const record of oldProgressRecords) {
      if (!record.userId) {
        stats.errors.push(`Record ${record.id}: missing userId`);
        continue;
      }

      // Determine moduleId
      let moduleId = record.moduleId;
      if (!moduleId && record.lessonId) {
        // Try to get moduleId from lesson
        const lesson = await prisma.lesson.findUnique({
          where: { id: record.lessonId },
          select: { moduleId: true },
        });
        moduleId = lesson?.moduleId ?? null;
      }

      if (!moduleId) {
        stats.skippedNoModule++;
        continue;
      }

      // Initialize maps
      if (!userModuleMap.has(record.userId)) {
        userModuleMap.set(record.userId, new Map());
      }
      const moduleMap = userModuleMap.get(record.userId)!;

      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, []);
      }
      moduleMap.get(moduleId)!.push(record);
    }

    // Step 3: Migrate each user's module progress
    for (const [userId, moduleMap] of userModuleMap) {
      for (const [moduleId, progressRecords] of moduleMap) {
        try {
          await migrateUserModuleProgress(userId, moduleId, progressRecords, stats);
        } catch (error: any) {
          stats.errors.push(`User ${userId}, Module ${moduleId}: ${error.message}`);
        }
      }
    }

    return stats;
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateUserModuleProgress(
  userId: string,
  moduleId: string,
  progressRecords: any[],
  stats: MigrationStats
): Promise<void> {
  // Check if LearningProgress already exists
  const existingLearningProgress = await prisma.learningProgress.findUnique({
    where: { userId_moduleId: { userId, moduleId } },
    include: { lessons: true },
  });

  if (existingLearningProgress) {
    console.log(`  [SKIP] LearningProgress exists for user=${userId}, module=${moduleId}`);
    stats.skippedAlreadyExists++;

    // Still migrate lesson-level data if missing
    for (const record of progressRecords) {
      if (!record.lessonId) continue;

      const existingLessonProgress = existingLearningProgress.lessons.find(
        (lp) => lp.lessonId === record.lessonId
      );

      if (!existingLessonProgress && !DRY_RUN) {
        await prisma.lessonProgress.create({
          data: {
            progressId: existingLearningProgress.id,
            lessonId: record.lessonId,
            currentStepIndex: record.currentStep ?? 0,
            totalSteps: record.totalSteps ?? 1,
            completed: record.completed ?? false,
            timeSpent: record.timeSpent ?? 0,
            lastAccessed: record.lastAccess ?? record.updatedAt,
          },
        });
        stats.migratedLessonProgress++;
        console.log(`    [MIGRATE] LessonProgress for lesson=${record.lessonId}`);
      }
    }
    return;
  }

  // Find the most recent lesson access
  const mostRecentLesson = progressRecords
    .filter((r) => r.lessonId)
    .sort((a, b) => (b.lastAccess?.getTime() ?? 0) - (a.lastAccess?.getTime() ?? 0))[0];

  // Calculate total time spent
  const totalTimeSpent = progressRecords.reduce((sum, r) => sum + (r.timeSpent ?? 0), 0);

  // Check if module is complete
  const moduleComplete = progressRecords.every((r) => r.completed);

  console.log(`  [MIGRATE] Creating LearningProgress for user=${userId}, module=${moduleId}`);

  if (!DRY_RUN) {
    const learningProgress = await prisma.learningProgress.create({
      data: {
        userId,
        moduleId,
        lastAccessedLessonId: mostRecentLesson?.lessonId ?? null,
        lastAccessedAt: mostRecentLesson?.lastAccess ?? mostRecentLesson?.updatedAt ?? new Date(),
        timeSpent: totalTimeSpent,
        completedAt: moduleComplete ? new Date() : null,
      },
    });
    stats.migratedModuleProgress++;

    // Create LessonProgress for each lesson
    for (const record of progressRecords) {
      if (!record.lessonId) {
        stats.skippedNoLesson++;
        continue;
      }

      await prisma.lessonProgress.create({
        data: {
          progressId: learningProgress.id,
          lessonId: record.lessonId,
          currentStepIndex: record.currentStep ?? 0,
          totalSteps: record.totalSteps ?? 1,
          completed: record.completed ?? false,
          timeSpent: record.timeSpent ?? 0,
          lastAccessed: record.lastAccess ?? record.updatedAt,
        },
      });
      stats.migratedLessonProgress++;
      console.log(`    [MIGRATE] LessonProgress for lesson=${record.lessonId}`);
    }
  } else {
    console.log(`    [DRY RUN] Would create ${progressRecords.length} lesson progress records`);
    stats.migratedModuleProgress++;
    stats.migratedLessonProgress += progressRecords.filter((r) => r.lessonId).length;
  }
}

// Run migration
migrateProgressData()
  .then((stats) => {
    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`Old Progress records found: ${stats.oldProgressRecords}`);
    console.log(`Module progress migrated: ${stats.migratedModuleProgress}`);
    console.log(`Lesson progress migrated: ${stats.migratedLessonProgress}`);
    console.log(`Skipped (no lesson): ${stats.skippedNoLesson}`);
    console.log(`Skipped (no module): ${stats.skippedNoModule}`);
    console.log(`Skipped (already exists): ${stats.skippedAlreadyExists}`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors (${stats.errors.length}):`);
      stats.errors.forEach((e) => console.log(`  - ${e}`));
    }

    if (DRY_RUN) {
      console.log('\n[DRY RUN] No changes were made. Remove DRY_RUN=true to apply changes.');
    }

    process.exit(stats.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
