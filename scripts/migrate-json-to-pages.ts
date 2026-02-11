/**
 * Phase 1 Batch Migration: JSON Lessons → Page + PageSections
 *
 * Migrates Beginner-level lesson JSON files into the database.
 * Idempotent: skips lessons already migrated (by legacyJsonId).
 *
 * Usage:
 *   npx tsx scripts/migrate-json-to-pages.ts
 */

import { PrismaClient, SectionType, PageType, ContentDifficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

// ============================================
// Lesson Descriptors
// ============================================

interface LessonDescriptor {
  jsonFile: string;       // Filename inside the JSON base directory
  moduleId: string;       // DB Module.id
  legacyLessonId: string; // DB Lesson.id (for coexistence traceability)
}

const JSON_BASE_DIR = path.resolve(
  __dirname,
  '../../ventilab-web/src/data/lessons/module-01-fundamentals'
);

const LESSONS: LessonDescriptor[] = [
  {
    jsonFile: 'module-01-inversion-fisiologica.json',
    moduleId: 'module-01-inversion-fisiologica',
    legacyLessonId: 'lesson-inversion-fisiologica',
  },
  {
    jsonFile: 'module-02-ecuacion-movimiento.json',
    moduleId: 'module-02-ecuacion-movimiento',
    legacyLessonId: 'lesson-ecuacion-movimiento',
  },
  {
    jsonFile: 'module-03-variables-fase.json',
    moduleId: 'module-03-variables-fase',
    legacyLessonId: 'lesson-variables-fase',
  },
  {
    jsonFile: 'module-04-modos-ventilatorios.json',
    moduleId: 'module-04-modos-ventilatorios',
    legacyLessonId: 'lesson-modos-ventilatorios',
  },
  {
    jsonFile: 'module-05-monitorizacion-grafica.json',
    moduleId: 'module-05-monitorizacion-grafica',
    legacyLessonId: 'lesson-monitorizacion-grafica',
  },
  {
    jsonFile: 'module-06-efectos-sistemicos.json',
    moduleId: 'module-06-efectos-sistemicos',
    legacyLessonId: 'lesson-efectos-sistemicos',
  },
];

const SYSTEM_USER_EMAIL = 'system@ventylab.local';

// ============================================
// Types
// ============================================

interface MigrationResult {
  module: string;
  title: string;
  sections: number;
  exercises: number;
  quiz: string;
  status: 'CREATED' | 'SKIPPED';
  pageId: string | null;
  warnings: string[];
}

// ============================================
// Helper: Fix broken learningObjectives
// ============================================
function fixLearningObjectives(raw: string[]): { fixed: string[]; wasFixed: boolean } {
  if (!raw || raw.length === 0) return { fixed: [], wasFixed: false };

  const fixed: string[] = [];
  let current = '';
  let hadConcatenation = false;

  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const startsNew = /^[A-ZÁÉÍÓÚÑ]/.test(trimmed);

    if (startsNew && current) {
      fixed.push(current.trim());
      current = trimmed;
    } else if (startsNew) {
      current = trimmed;
    } else {
      current += ' ' + trimmed;
      hadConcatenation = true;
    }
  }

  if (current) {
    fixed.push(current.trim());
  }

  return { fixed, wasFixed: hadConcatenation };
}

// ============================================
// Helper: Map JSON section type → SectionType enum
// ============================================
function mapSectionType(jsonType: string): SectionType {
  const mapping: Record<string, SectionType> = {
    introduction: 'INTRODUCTION',
    theory: 'THEORY',
    case: 'CASE_STUDY',
    summary: 'SUMMARY',
  };
  return mapping[jsonType.toLowerCase()] || 'TEXT';
}

// ============================================
// Helper: Map JSON difficulty → ContentDifficulty enum
// ============================================
function mapDifficulty(jsonDifficulty: string): ContentDifficulty {
  const mapping: Record<string, ContentDifficulty> = {
    beginner: 'BEGINNER',
    intermediate: 'INTERMEDIATE',
    advanced: 'ADVANCED',
  };
  return mapping[jsonDifficulty?.toLowerCase()] || 'INTERMEDIATE';
}

// ============================================
// Helper: Slugify
// ============================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// ============================================
// Migrate a single lesson
// ============================================
async function migrateLesson(
  descriptor: LessonDescriptor,
  systemUserId: string
): Promise<MigrationResult> {
  const warnings: string[] = [];
  const jsonPath = path.join(JSON_BASE_DIR, descriptor.jsonFile);

  // 1. Read JSON
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const exerciseCount = json.exercises?.length || 0;
  const quizPresent = json.quiz ? `yes (${json.quiz.questions?.length || 0}q)` : 'no';

  // 2. Check idempotency — skip if already migrated
  const existingByJsonId = await prisma.page.findFirst({
    where: { legacyJsonId: json.id },
  });
  if (existingByJsonId) {
    return {
      module: descriptor.moduleId,
      title: json.title,
      sections: 0,
      exercises: exerciseCount,
      quiz: quizPresent,
      status: 'SKIPPED',
      pageId: existingByJsonId.id,
      warnings: ['Already migrated by legacyJsonId'],
    };
  }

  const existingByLessonId = await prisma.page.findFirst({
    where: { legacyLessonId: descriptor.legacyLessonId },
  });
  if (existingByLessonId) {
    return {
      module: descriptor.moduleId,
      title: json.title,
      sections: 0,
      exercises: exerciseCount,
      quiz: quizPresent,
      status: 'SKIPPED',
      pageId: existingByLessonId.id,
      warnings: ['Already migrated by legacyLessonId'],
    };
  }

  // 3. Verify module exists in DB
  const module = await prisma.module.findUnique({
    where: { id: descriptor.moduleId },
  });
  if (!module) {
    throw new Error(
      `Module "${descriptor.moduleId}" not found in DB. Run prisma seed first.`
    );
  }

  // 4. Fix learningObjectives
  const { fixed: fixedObjectives, wasFixed } = fixLearningObjectives(
    json.learningObjectives || []
  );
  if (wasFixed) {
    warnings.push(
      `learningObjectives auto-fixed: ${json.learningObjectives.length} items → ${fixedObjectives.length} objectives`
    );
  }
  // Detect truncated last objective
  const lastObj = fixedObjectives[fixedObjectives.length - 1];
  if (lastObj && !/[.)\]!?]$/.test(lastObj.trim())) {
    warnings.push(`Last objective may be truncated: "...${lastObj.slice(-40)}"`);
  }

  // 5. Check for data quality issues
  const sectionsRaw = json.sections || [];
  const missingTitles = sectionsRaw.filter((s: any) => !s.title).length;
  if (missingTitles > 0) {
    warnings.push(`${missingTitles} sections missing titles`);
  }
  const nullEstimates = sectionsRaw.filter((s: any) => s.estimatedTime == null).length;
  if (nullEstimates > 0) {
    warnings.push(`${nullEstimates} sections with null estimatedTime`);
  }

  // 6. Create Page + PageSections in transaction
  const page = await prisma.$transaction(
    async (tx) => {
      const createdPage = await tx.page.create({
        data: {
          moduleId: descriptor.moduleId,
          title: json.title,
          slug: slugify(json.title),
          order: 1, // Each beginner module has exactly 1 lesson
          type: 'THEORY' as PageType,
          description: json.description || null,
          difficulty: mapDifficulty(json.difficulty),
          bloomLevel: json.bloomLevel || null,
          estimatedMinutes: json.estimatedTime || null,
          learningObjectives: fixedObjectives,
          prerequisites: json.prerequisites || [],
          keyTakeaways: [],
          tags: [],
          hasRequiredQuiz: !!json.quiz,
          minQuizScore: json.quiz?.passingScore != null
            ? (json.quiz.passingScore / json.quiz.questions.length) * 100
            : null,
          aiConfig: json.ai_integration || null,
          resources: json.resources || null,
          version: 1,
          isActive: true,
          isPublished: true,
          publishedAt: new Date(),
          legacyLessonId: descriptor.legacyLessonId,
          legacyJsonId: json.id,
          createdBy: systemUserId,
        },
      });

      // Sections from JSON
      let sectionOrder = 1;
      for (const section of sectionsRaw) {
        await tx.pageSection.create({
          data: {
            pageId: createdPage.id,
            order: sectionOrder++,
            type: mapSectionType(section.type),
            title: section.title || null,
            content: section.content || { markdown: '' },
            sectionId: section.id || null,
            estimatedTime: section.estimatedTime || null,
            isActive: true,
            createdBy: systemUserId,
          },
        });
      }

      // Exercises
      const exercises = json.exercises || [];
      for (const exercise of exercises) {
        await tx.pageSection.create({
          data: {
            pageId: createdPage.id,
            order: sectionOrder++,
            type: 'EXERCISE' as SectionType,
            title: exercise.title || 'Ejercicio',
            content: {
              exerciseType: exercise.type,
              isEvaluation: exercise.is_evaluation || false,
              instructions: exercise.instructions || '',
              estimatedTime: exercise.estimated_time || null,
              categories: exercise.content?.categories || [],
              items: exercise.content?.items || [],
              hints: exercise.hints || [],
              feedbackOnComplete: exercise.feedback_on_complete || '',
              learningPoints: exercise.learning_points || [],
            },
            sectionId: exercise.id || null,
            estimatedTime: exercise.estimated_time || null,
            isActive: true,
            createdBy: systemUserId,
          },
        });
      }

      // Quiz
      if (json.quiz) {
        await tx.pageSection.create({
          data: {
            pageId: createdPage.id,
            order: sectionOrder++,
            type: 'QUIZ' as SectionType,
            title: `Quiz: ${json.title.substring(0, 50)}`,
            content: {
              quizId: json.quiz.id,
              passingScore: json.quiz.passingScore,
              questions: json.quiz.questions,
            },
            sectionId: json.quiz.id || null,
            isActive: true,
            createdBy: systemUserId,
          },
        });
      }

      // PageRevision snapshot
      const allSections = await tx.pageSection.findMany({
        where: { pageId: createdPage.id },
        orderBy: { order: 'asc' },
      });

      await tx.pageRevision.create({
        data: {
          pageId: createdPage.id,
          version: 1,
          title: createdPage.title,
          type: createdPage.type,
          sectionsSnapshot: allSections.map((s) => ({
            id: s.id,
            order: s.order,
            type: s.type,
            title: s.title,
            content: s.content,
            sectionId: s.sectionId,
            estimatedTime: s.estimatedTime,
          })),
          changeLog: 'Initial migration from JSON',
          changedBy: systemUserId,
        },
      });

      return createdPage;
    },
    { maxWait: 10000, timeout: 60000 }
  );

  // Count final sections
  const finalCount = await prisma.pageSection.count({
    where: { pageId: page.id },
  });

  return {
    module: descriptor.moduleId,
    title: json.title,
    sections: finalCount,
    exercises: exerciseCount,
    quiz: quizPresent,
    status: 'CREATED',
    pageId: page.id,
    warnings,
  };
}

// ============================================
// Validation (per page)
// ============================================
async function validatePage(pageId: string): Promise<boolean> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      sections: { orderBy: { order: 'asc' } },
      revisions: true,
    },
  });

  if (!page) return false;

  const orders = page.sections.map((s) => s.order);
  const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
  const orderOk = JSON.stringify(orders) === JSON.stringify(expected);

  if (!orderOk) {
    console.error(`    ✗ Section ordering BROKEN for page ${pageId}`);
    return false;
  }

  if (!page.isPublished) {
    console.error(`    ✗ Page not published: ${pageId}`);
    return false;
  }

  if (page.revisions.length === 0) {
    console.error(`    ✗ No PageRevision for page ${pageId}`);
    return false;
  }

  return true;
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('='.repeat(70));
  console.log('  Phase 1 Batch Migration: Beginner Lessons → Pages');
  console.log('='.repeat(70));

  // Resolve system user
  let systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
  });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_USER_EMAIL,
        name: 'System Migration',
        role: 'SUPERUSER',
      },
    });
    console.log(`\n  Created system user: ${systemUser.id}`);
  } else {
    console.log(`\n  System user: ${systemUser.id}`);
  }

  // Migrate each lesson sequentially
  const results: MigrationResult[] = [];

  for (let i = 0; i < LESSONS.length; i++) {
    const descriptor = LESSONS[i];
    console.log(`\n[${ i + 1}/${LESSONS.length}] ${descriptor.jsonFile}`);

    try {
      const result = await migrateLesson(descriptor, systemUser.id);
      results.push(result);

      if (result.status === 'SKIPPED') {
        console.log(`  ⏭  SKIPPED (${result.warnings[0]})`);
      } else {
        console.log(`  ✓  CREATED → ${result.sections} sections`);

        // Validate
        const valid = await validatePage(result.pageId!);
        if (!valid) {
          console.error(`  ✗  VALIDATION FAILED`);
        }
      }

      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          console.log(`  ⚠  ${w}`);
        }
      }
    } catch (error: any) {
      console.error(`  ✗  FAILED: ${error.message}`);
      results.push({
        module: descriptor.moduleId,
        title: descriptor.jsonFile,
        sections: 0,
        exercises: 0,
        quiz: '?',
        status: 'SKIPPED',
        pageId: null,
        warnings: [`ERROR: ${error.message}`],
      });
    }
  }

  // ============================================
  // Summary table
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('  MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log(
    padRight('Module', 38) +
    padRight('Sections', 10) +
    padRight('Ex', 5) +
    padRight('Quiz', 12) +
    padRight('Status', 10)
  );
  console.log('-'.repeat(75));

  let created = 0;
  let skipped = 0;

  for (const r of results) {
    const moduleShort = r.module.replace('module-', 'm');
    console.log(
      padRight(moduleShort, 38) +
      padRight(String(r.sections), 10) +
      padRight(String(r.exercises), 5) +
      padRight(r.quiz, 12) +
      padRight(r.status, 10)
    );
    if (r.status === 'CREATED') created++;
    else skipped++;
  }

  console.log('-'.repeat(75));
  console.log(`  Created: ${created}  |  Skipped: ${skipped}  |  Total: ${results.length}`);
  console.log('');

  // Print all warnings grouped
  const allWarnings = results.filter((r) => r.warnings.length > 0);
  if (allWarnings.length > 0) {
    console.log('  WARNINGS:');
    for (const r of allWarnings) {
      for (const w of r.warnings) {
        console.log(`    [${r.module.replace('module-', '')}] ${w}`);
      }
    }
    console.log('');
  }

  // Print page IDs for testing
  const createdPages = results.filter((r) => r.status === 'CREATED' && r.pageId);
  if (createdPages.length > 0) {
    console.log('  TEST ENDPOINTS:');
    for (const r of createdPages) {
      console.log(`    GET /api/pages/${r.pageId}`);
    }
    console.log('');
  }

  console.log('='.repeat(70));
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

// ============================================
// Run
// ============================================
main()
  .catch((error) => {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
