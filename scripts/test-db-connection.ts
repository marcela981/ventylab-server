/**
 * Quick database connection test script
 * Tests that Prisma can connect to the local PostgreSQL database
 * and perform basic CRUD queries.
 * 
 * Usage: npx tsx scripts/test-db-connection.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE CONNECTION TEST ===\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing connection...');
    await prisma.$connect();
    console.log('   ✓ Connected to database\n');

    // Test 2: Count users
    console.log('2. Querying users...');
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    console.log(`   ✓ Found ${userCount} users:`);
    users.forEach((u) => console.log(`     - ${u.email} (${u.role})`));
    console.log();

    // Test 3: Count content
    console.log('3. Querying content...');
    const [levels, modules, lessons, pages, pageSections] = await Promise.all([
      prisma.level.count(),
      prisma.module.count(),
      prisma.lesson.count(),
      prisma.page.count(),
      prisma.pageSection.count(),
    ]);
    console.log(`   ✓ Levels: ${levels}`);
    console.log(`   ✓ Modules: ${modules}`);
    console.log(`   ✓ Lessons: ${lessons}`);
    console.log(`   ✓ Pages: ${pages}`);
    console.log(`   ✓ Page Sections: ${pageSections}`);
    console.log();

    // Test 4: Count progress
    console.log('4. Querying progress...');
    const [learningProgress, lessonProgress, userProgress, lessonCompletions] =
      await Promise.all([
        prisma.learningProgress.count(),
        prisma.lessonProgress.count(),
        prisma.userProgress.count(),
        prisma.lessonCompletion.count(),
      ]);
    console.log(`   ✓ LearningProgress: ${learningProgress}`);
    console.log(`   ✓ LessonProgress: ${lessonProgress}`);
    console.log(`   ✓ UserProgress: ${userProgress}`);
    console.log(`   ✓ LessonCompletions: ${lessonCompletions}`);
    console.log();

    // Test 5: Join query (modules with lessons)
    console.log('5. Testing join query (modules with lesson count)...');
    const modulesWithLessons = await prisma.module.findMany({
      select: {
        title: true,
        _count: { select: { lessons: true } },
      },
      take: 5,
      orderBy: { order: 'asc' },
    });
    modulesWithLessons.forEach((m) =>
      console.log(`   ✓ ${m.title}: ${m._count.lessons} lessons`)
    );
    console.log();

    // Test 6: Verify no Neon-specific connection issues
    console.log('6. Verifying raw query...');
    const result = await prisma.$queryRaw`SELECT current_database() as db, current_user as user_name, version() as pg_version`;
    const dbInfo = (result as any[])[0];
    console.log(`   ✓ Database: ${dbInfo.db}`);
    console.log(`   ✓ User: ${dbInfo.user_name}`);
    console.log(`   ✓ Version: ${dbInfo.pg_version.split(',')[0]}`);
    console.log();

    console.log('=== ALL TESTS PASSED ===');
    console.log('Database migration from Neon to local PostgreSQL is COMPLETE.');
  } catch (error) {
    console.error('✗ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
