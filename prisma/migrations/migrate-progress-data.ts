/**
 * FASE 3 - Data Migration Script
 * ================================
 * Migrates data from legacy progress tables to unified system.
 *
 * Legacy (source):   LearningProgress + LessonProgress
 * Unified (target):  UserProgress + LessonCompletion
 *
 * Run with:
 *   node -e "require('tsx').register(); require('./prisma/migrations/migrate-progress-data.ts')"
 * Or:
 *   npx tsx prisma/migrations/migrate-progress-data.ts
 *
 * SAFE TO RUN MULTIPLE TIMES - uses upsert for idempotency.
 * DOES NOT DELETE source data (legacy tables kept until manual verification).
 */

import { PrismaClient, ProgressStatus } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ============================================
// STATISTICS
// ============================================
let stats = {
  learningProgressMigrated: 0,
  learningProgressSkipped: 0,
  lessonProgressMigrated: 0,
  lessonProgressSkipped: 0,
  errors: 0,
  warnings: [] as string[],
};

// ============================================
// MAIN MIGRATION
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('FASE 3 - Progress Data Migration');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Verify source tables have data
  const learningProgressCount = await prisma.learningProgress.count();
  const lessonProgressCount = await prisma.lessonProgress.count();

  console.log(`📊 Source data:`);
  console.log(`   LearningProgress records: ${learningProgressCount}`);
  console.log(`   LessonProgress records:   ${lessonProgressCount}`);
  console.log();

  // Step 2: Verify target tables exist (Prisma schema already applied)
  const userProgressCount = await prisma.userProgress.count();
  const lessonCompletionCount = await prisma.lessonCompletion.count();

  console.log(`📊 Target data (before migration):`);
  console.log(`   UserProgress records:     ${userProgressCount}`);
  console.log(`   LessonCompletion records: ${lessonCompletionCount}`);
  console.log();

  if (learningProgressCount === 0) {
    console.log('ℹ️  No LearningProgress records to migrate. Skipping.');
  } else {
    await migrateLearningProgress();
  }

  if (lessonProgressCount === 0) {
    console.log('ℹ️  No LessonProgress records to migrate. Skipping.');
  } else {
    await migrateLessonProgress();
  }

  // Step 3: Verify integrity
  await verifyIntegrity();

  // Step 4: Print summary
  printSummary();
}

// ============================================
// MIGRATE LearningProgress → UserProgress
// ============================================

async function migrateLearningProgress() {
  console.log('📦 Migrating LearningProgress → UserProgress...');

  // Load all LearningProgress with module and lesson counts
  const allLearningProgress = await prisma.learningProgress.findMany({
    include: {
      lessons: true,
      module: {
        select: {
          id: true,
          isActive: true,
          lessons: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  for (const lp of allLearningProgress) {
    try {
      // Calculate stats from lesson progress
      const completedLessons = lp.lessons.filter(l => l.completed);
      const totalLessons = lp.module.lessons.length;
      const completedCount = completedLessons.length;
      const progressPercentage = totalLessons > 0
        ? (completedCount / totalLessons) * 100
        : 0;

      const status: ProgressStatus = progressPercentage >= 100
        ? ProgressStatus.COMPLETED
        : progressPercentage > 0
          ? ProgressStatus.IN_PROGRESS
          : ProgressStatus.NOT_STARTED;

      // Upsert into UserProgress
      // If a UserProgress record already exists (from teaching system), MERGE the time
      const existing = await prisma.userProgress.findUnique({
        where: { userId_moduleId: { userId: lp.userId, moduleId: lp.moduleId } },
      });

      if (existing) {
        // Merge: keep best data from both systems
        await prisma.userProgress.update({
          where: { userId_moduleId: { userId: lp.userId, moduleId: lp.moduleId } },
          data: {
            // Keep better completion data
            completedLessonsCount: Math.max(existing.completedLessonsCount, completedCount),
            totalLessons: Math.max(existing.totalLessons, totalLessons),
            progressPercentage: Math.max(existing.progressPercentage, progressPercentage),
            status: progressPercentage >= 100 ? ProgressStatus.COMPLETED
                  : existing.status === ProgressStatus.COMPLETED ? ProgressStatus.COMPLETED
                  : status,
            isModuleCompleted: progressPercentage >= 100 || existing.isModuleCompleted,
            // Merge time
            timeSpent: existing.timeSpent + lp.timeSpent,
            // Use the more recent lastAccessedAt
            lastAccessedAt: existing.lastAccessedAt > lp.lastAccessedAt!
              ? existing.lastAccessedAt
              : (lp.lastAccessedAt ?? existing.lastAccessedAt),
            // Keep existing lastAccessedLessonId if set, otherwise use LearningProgress
            lastAccessedLessonId: existing.lastAccessedLessonId ?? lp.lastAccessedLessonId,
            // Keep earliest completedAt
            completedAt: existing.completedAt ?? lp.completedAt,
          },
        });
        stats.learningProgressMigrated++;
      } else {
        // Create new UserProgress from LearningProgress data
        await prisma.userProgress.create({
          data: {
            userId: lp.userId,
            moduleId: lp.moduleId,
            status,
            isModuleCompleted: progressPercentage >= 100,
            completedLessonsCount: completedCount,
            totalLessons,
            progressPercentage,
            timeSpent: lp.timeSpent,
            lastAccessedLessonId: lp.lastAccessedLessonId,
            lastAccessedAt: lp.lastAccessedAt ?? new Date(),
            startedAt: lp.createdAt,
            completedAt: lp.completedAt,
          },
        });
        stats.learningProgressMigrated++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error migrating LearningProgress ${lp.id} (user ${lp.userId}):`, error.message);
      stats.errors++;
    }
  }

  console.log(`  ✅ Migrated ${stats.learningProgressMigrated} LearningProgress records`);
  if (stats.learningProgressSkipped > 0) {
    console.log(`  ⚠️  Skipped ${stats.learningProgressSkipped} records`);
  }
  console.log();
}

// ============================================
// MIGRATE LessonProgress → LessonCompletion
// ============================================

async function migrateLessonProgress() {
  console.log('📦 Migrating LessonProgress → LessonCompletion...');

  // Load all LessonProgress records with parent LearningProgress
  const allLessonProgress = await prisma.lessonProgress.findMany({
    include: {
      learningProgress: {
        select: { userId: true, moduleId: true },
      },
    },
  });

  for (const lp of allLessonProgress) {
    try {
      const userId = lp.learningProgress.userId;
      const lessonId = lp.lessonId;

      // Skip invalid lesson IDs (debug test data like "DEBUG_LESSON_...")
      if (lessonId.startsWith('DEBUG_')) {
        stats.lessonProgressSkipped++;
        continue;
      }

      // Verify lesson exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });

      if (!lesson) {
        stats.warnings.push(`LessonProgress ${lp.id}: lessonId "${lessonId}" not found in Lesson table — skipped`);
        stats.lessonProgressSkipped++;
        continue;
      }

      // Check if a LessonCompletion already exists (from teaching system)
      const existing = await prisma.lessonCompletion.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });

      if (existing) {
        // Merge: add step tracking data to existing completion record
        // Never downgrade isCompleted from true to false
        const mergedIsCompleted = existing.isCompleted || lp.completed;
        const mergedCompletedAt = existing.completedAt ?? (lp.completed ? (lp.lastAccessed ?? lp.createdAt) : null);

        await prisma.lessonCompletion.update({
          where: { userId_lessonId: { userId, lessonId } },
          data: {
            currentStepIndex: Math.max(existing.currentStepIndex, lp.currentStepIndex),
            totalSteps: lp.totalSteps > 1 ? lp.totalSteps : existing.totalSteps,
            timeSpent: existing.timeSpent + lp.timeSpent,
            lastAccessed: lp.lastAccessed ?? existing.lastAccessed,
            isCompleted: mergedIsCompleted,
            completedAt: mergedCompletedAt,
          },
        });
      } else {
        // Create new LessonCompletion from LessonProgress data
        await prisma.lessonCompletion.create({
          data: {
            userId,
            lessonId,
            currentStepIndex: lp.currentStepIndex,
            totalSteps: lp.totalSteps,
            timeSpent: lp.timeSpent,
            lastAccessed: lp.lastAccessed ?? lp.createdAt,
            isCompleted: lp.completed,
            completedAt: lp.completed ? (lp.lastAccessed ?? lp.createdAt) : null,
            // Quiz/case data defaults (not available in LessonProgress)
            quizAttempts: 0,
            caseAttempts: 0,
          },
        });
      }

      stats.lessonProgressMigrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating LessonProgress ${lp.id}:`, error.message);
      stats.errors++;
    }
  }

  console.log(`  ✅ Migrated ${stats.lessonProgressMigrated} LessonProgress records`);
  if (stats.lessonProgressSkipped > 0) {
    console.log(`  ⚠️  Skipped ${stats.lessonProgressSkipped} records (invalid/test data)`);
  }
  console.log();
}

// ============================================
// INTEGRITY VERIFICATION
// ============================================

async function verifyIntegrity() {
  console.log('🔍 Verifying data integrity...');

  // 1. Count users with progress in old vs new system
  const usersWithOldProgress = await prisma.learningProgress.groupBy({
    by: ['userId'],
    _count: { userId: true },
  });

  const usersWithNewProgress = await prisma.userProgress.groupBy({
    by: ['userId'],
    _count: { userId: true },
  });

  const oldUserIds = new Set(usersWithOldProgress.map(u => u.userId));
  const newUserIds = new Set(usersWithNewProgress.map(u => u.userId));

  const missingInNew = [...oldUserIds].filter(id => !newUserIds.has(id));

  if (missingInNew.length > 0) {
    console.log(`  ⚠️  ${missingInNew.length} user(s) have LearningProgress but no UserProgress:`);
    missingInNew.forEach(id => console.log(`     - ${id}`));
  } else {
    console.log(`  ✅ All ${oldUserIds.size} users with LearningProgress have UserProgress`);
  }

  // 2. Check completed lesson counts match
  const oldCompletedLessons = await prisma.lessonProgress.count({
    where: { completed: true },
  });

  const newCompletedLessons = await prisma.lessonCompletion.count({
    where: { isCompleted: true },
  });

  console.log(`  📊 Completed lessons: old=${oldCompletedLessons}, new=${newCompletedLessons}`);

  if (oldCompletedLessons > newCompletedLessons) {
    const diff = oldCompletedLessons - newCompletedLessons;
    console.log(`  ⚠️  ${diff} completed lesson(s) may not be migrated (check for missing lesson IDs)`);
  } else {
    console.log(`  ✅ Completion counts look good`);
  }

  // 3. Print warnings
  if (stats.warnings.length > 0) {
    console.log(`\n  ⚠️  Warnings (${stats.warnings.length}):`);
    stats.warnings.forEach(w => console.log(`     - ${w}`));
  }

  console.log();
}

// ============================================
// SUMMARY
// ============================================

function printSummary() {
  console.log('='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  LearningProgress → UserProgress:    ${stats.learningProgressMigrated} migrated`);
  console.log(`  LessonProgress → LessonCompletion:  ${stats.lessonProgressMigrated} migrated, ${stats.lessonProgressSkipped} skipped`);
  console.log(`  Errors:                             ${stats.errors}`);
  console.log();

  if (stats.errors > 0) {
    console.log('❌ Migration completed WITH ERRORS. Review above output.');
    console.log('   Do NOT remove legacy tables until errors are resolved.');
  } else if (stats.warnings.length > 0) {
    console.log('⚠️  Migration completed with warnings. Review output above.');
    console.log('   Legacy tables kept. Run verification before removing them.');
  } else {
    console.log('✅ Migration completed successfully!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Verify UI works correctly with new progress data');
    console.log('  2. When confident, run: npx prisma migrate dev --name remove-legacy-progress');
    console.log('     (This will drop LearningProgress + LessonProgress tables)');
  }
  console.log('='.repeat(60));
}

// ============================================
// ENTRY POINT
// ============================================

main()
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
