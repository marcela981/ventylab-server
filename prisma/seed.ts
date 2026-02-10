/**
 * VentyLab Curriculum Seed Script
 * ================================
 * One-time migration that makes the database the SINGLE source of truth.
 *
 * Sources: Frontend curriculumData.js + lesson JSON files
 * Targets: Level → Module → Lesson (+ prerequisites)
 *
 * SAFE TO RE-RUN: Uses TRUNCATE CASCADE then re-inserts.
 * NEVER TOUCHES: users, accounts, sessions, quizzes, clinical_cases, etc.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// 1. DATA DEFINITIONS
// ============================================

// --- LEVELS ---
const LEVELS = [
  {
    id: 'level-prerequisitos',
    title: 'Prerequisitos',
    description: 'Contenido fundamental opcional para reforzar bases antes de iniciar el currículo principal',
    order: 1,
  },
  {
    id: 'level-beginner',
    title: 'Nivel Principiante',
    description: 'Fundamentos fisiológicos y conceptos básicos de ventilación mecánica',
    order: 2,
  },
  {
    id: 'level-intermedio',
    title: 'Nivel Intermedio',
    description: 'Modalidades ventilatorias y manejo de parámetros críticos',
    order: 3,
  },
  {
    id: 'level-avanzado',
    title: 'Nivel Avanzado',
    description: 'Estrategias especializadas y casos clínicos complejos',
    order: 4,
  },
];

// --- MODULES WITH EMBEDDED LESSONS ---
interface LessonDef {
  id: string;
  title: string;
  slug: string;
  order: number;
  estimatedTime: number;
}

interface ModuleDef {
  id: string;
  levelId: string;
  title: string;
  description: string;
  difficulty: string;
  order: number;
  estimatedTime: number;
  lessons: LessonDef[];
}

const MODULES: ModuleDef[] = [
  // ========================================
  // PREREQUISITOS (2 modules, 5 lessons)
  // ========================================
  {
    id: 'respiratory-physiology',
    levelId: 'level-prerequisitos',
    title: 'Fisiología Respiratoria',
    description: 'Principios del intercambio gaseoso, mecánica ventilatoria y difusión',
    difficulty: 'prerequisitos',
    order: 1,
    estimatedTime: 150,
    lessons: [
      { id: 'rp-inversion-fisiologica', title: 'La Inversión Fisiológica (Fundamentos)', slug: 'inversion-fisiologica', order: 1, estimatedTime: 45 },
      { id: 'rp-ecuacion-movimiento', title: 'Ecuación de Movimiento (Fundamentos)', slug: 'ecuacion-movimiento', order: 2, estimatedTime: 50 },
      { id: 'rp-variables-fase', title: 'Variables de Fase (Fundamentos)', slug: 'variables-fase', order: 3, estimatedTime: 54 },
    ],
  },
  {
    id: 'ventilation-principles',
    levelId: 'level-prerequisitos',
    title: 'Principios de Ventilación Mecánica',
    description: 'Indicaciones, objetivos y parámetros básicos de configuración del ventilador',
    difficulty: 'prerequisitos',
    order: 2,
    estimatedTime: 65,
    lessons: [
      { id: 'vm-indications', title: 'Indicaciones de Ventilación Mecánica', slug: 'indicaciones-vm', order: 1, estimatedTime: 25 },
      { id: 'basic-parameters', title: 'Parámetros Ventilatorios Básicos', slug: 'parametros-basicos', order: 2, estimatedTime: 40 },
    ],
  },

  // ========================================
  // BEGINNER (6 modules, 1 lesson each)
  // Each module = 1 "book" with one monolithic lesson.
  // Sections within the JSON are content-level, not DB entities.
  // ========================================
  {
    id: 'module-01-inversion-fisiologica',
    levelId: 'level-beginner',
    title: 'Inversión Fisiológica',
    description: 'Fundamentos de la inversión fisiológica en ventilación mecánica',
    difficulty: 'beginner',
    order: 1,
    estimatedTime: 211,
    lessons: [
      { id: 'lesson-inversion-fisiologica', title: 'La Inversión Fisiológica: De la Presión Negativa a la Positiva', slug: 'inversion-fisiologica', order: 1, estimatedTime: 211 },
    ],
  },
  {
    id: 'module-02-ecuacion-movimiento',
    levelId: 'level-beginner',
    title: 'Ecuación de Movimiento',
    description: 'Principios de la ecuación de movimiento respiratorio',
    difficulty: 'beginner',
    order: 2,
    estimatedTime: 50,
    lessons: [
      { id: 'lesson-ecuacion-movimiento', title: 'El Santo Grial – La Ecuación del Movimiento Respiratorio', slug: 'ecuacion-movimiento', order: 1, estimatedTime: 50 },
    ],
  },
  {
    id: 'module-03-variables-fase',
    levelId: 'level-beginner',
    title: 'Variables de Fase',
    description: 'Análisis de las variables de fase en el ciclo ventilatorio',
    difficulty: 'beginner',
    order: 3,
    estimatedTime: 54,
    lessons: [
      { id: 'lesson-variables-fase', title: 'La Lógica de la Máquina: Variables de Fase y el Ciclo Respiratorio', slug: 'variables-fase', order: 1, estimatedTime: 54 },
    ],
  },
  {
    id: 'module-04-modos-ventilatorios',
    levelId: 'level-beginner',
    title: 'Modos Ventilatorios',
    description: 'Comprensión de los diferentes modos de ventilación mecánica',
    difficulty: 'beginner',
    order: 4,
    estimatedTime: 114,
    lessons: [
      { id: 'lesson-modos-ventilatorios', title: 'Taxonomía de los Modos: Volumen vs. Presión (Control y Asistencia)', slug: 'modos-ventilatorios', order: 1, estimatedTime: 114 },
    ],
  },
  {
    id: 'module-05-monitorizacion-grafica',
    levelId: 'level-beginner',
    title: 'Monitorización Gráfica',
    description: 'Interpretación de curvas y gráficos ventilatorios',
    difficulty: 'beginner',
    order: 5,
    estimatedTime: 480,
    lessons: [
      { id: 'lesson-monitorizacion-grafica', title: 'Monitorización Gráfica I: Escalares, Bucles y Asincronías básicas', slug: 'monitorizacion-grafica', order: 1, estimatedTime: 480 },
    ],
  },
  {
    id: 'module-06-efectos-sistemicos',
    levelId: 'level-beginner',
    title: 'Efectos Sistémicos',
    description: 'Efectos sistémicos de la ventilación mecánica',
    difficulty: 'beginner',
    order: 6,
    estimatedTime: 600,
    lessons: [
      { id: 'lesson-efectos-sistemicos', title: 'Efectos Sistémicos y Lesión Inducida por la Ventilación (VILI)', slug: 'efectos-sistemicos', order: 1, estimatedTime: 600 },
    ],
  },

  // ========================================
  // INTERMEDIATE (6 modules, 16 lessons)
  // ========================================
  {
    id: 'principles-mechanical-ventilation',
    levelId: 'level-intermedio',
    title: 'Principios de Ventilación Mecánica',
    description: 'Diferencias entre modalidades controladas por volumen y por presión, indicaciones clínicas y resolución de alarmas',
    difficulty: 'intermediate',
    order: 1,
    estimatedTime: 180,
    lessons: [
      { id: 'ventilation-modes-vcv-pcv', title: 'Modalidades VCV y PCV', slug: 'modalidades-vcv-pcv', order: 1, estimatedTime: 30 },
      { id: 'ventilation-modes-assisted', title: 'Modalidades Asistidas SIMV y PSV', slug: 'modalidades-asistidas', order: 2, estimatedTime: 35 },
      { id: 'ventilation-parameters', title: 'Parámetros Ventilatorios Fundamentales', slug: 'parametros-fundamentales', order: 3, estimatedTime: 25 },
      { id: 'waveform-interpretation', title: 'Interpretación de Curvas Ventilatorias', slug: 'curvas-ventilatorias', order: 4, estimatedTime: 40 },
      { id: 'alarm-management', title: 'Sistema de Alarmas y Resolución', slug: 'alarmas-resolucion', order: 5, estimatedTime: 30 },
      { id: 'mode-comparison-practice', title: 'Práctica Comparación de Modalidades', slug: 'comparacion-modalidades', order: 6, estimatedTime: 20 },
    ],
  },
  {
    id: 'module-02-modalidades-parametros',
    levelId: 'level-intermedio',
    title: 'Modalidades Ventilatorias y Parámetros',
    description: 'Modalidades ventilatorias controladas por volumen y presión, configuración de parámetros y estrategias de ventilación protectora',
    difficulty: 'intermediate',
    order: 2,
    estimatedTime: 275,
    lessons: [
      { id: 'lesson-01-volume-ventilation', title: 'Ventilación Controlada por Volumen (VCV)', slug: 'volume-ventilation', order: 1, estimatedTime: 95 },
      { id: 'lesson-02-pressure-controlled-ventilation', title: 'Ventilación Controlada por Presión (PCV)', slug: 'pressure-controlled', order: 2, estimatedTime: 60 },
      { id: 'lesson-03-pressure-support-ventilation', title: 'Ventilación con Soporte de Presión (PSV)', slug: 'pressure-support', order: 3, estimatedTime: 60 },
      { id: 'lesson-04-simv-destete-evidencia', title: 'SIMV y Destete – Evidencia', slug: 'simv-destete', order: 4, estimatedTime: 60 },
    ],
  },
  {
    id: 'volume-control',
    levelId: 'level-intermedio',
    title: 'Ventilación Controlada por Volumen (VCV)',
    description: 'Funcionamiento de VCV, configuración de parámetros y práctica con simulación',
    difficulty: 'intermediate',
    order: 3,
    estimatedTime: 80,
    lessons: [
      { id: 'vcv-mechanics', title: 'Mecánica de VCV', slug: 'mecanica-vcv', order: 1, estimatedTime: 30 },
      { id: 'vcv-simulation', title: 'Simulación VCV', slug: 'simulacion-vcv', order: 2, estimatedTime: 50 },
    ],
  },
  {
    id: 'pressure-control',
    levelId: 'level-intermedio',
    title: 'Ventilación Controlada por Presión (PCV)',
    description: 'Configuración de PCV, relación presión-volumen y manejo de complicaciones',
    difficulty: 'intermediate',
    order: 4,
    estimatedTime: 80,
    lessons: [
      { id: 'pcv-mechanics', title: 'Mecánica de PCV', slug: 'mecanica-pcv', order: 1, estimatedTime: 35 },
      { id: 'pcv-simulation', title: 'Simulación PCV', slug: 'simulacion-pcv', order: 2, estimatedTime: 45 },
    ],
  },
  {
    id: 'psv-mode',
    levelId: 'level-intermedio',
    title: 'Ventilación con Soporte de Presión (PSV)',
    description: 'Funcionamiento de PSV, configuración de niveles de soporte y monitoreo',
    difficulty: 'intermediate',
    order: 5,
    estimatedTime: 30,
    lessons: [
      { id: 'psv-mechanics', title: 'Mecánica de PSV', slug: 'mecanica-psv', order: 1, estimatedTime: 30 },
    ],
  },
  {
    id: 'simv-mode',
    levelId: 'level-intermedio',
    title: 'Ventilación Mandatoria Intermitente Sincronizada (SIMV)',
    description: 'SIMV y sus aplicaciones en destete ventilatorio',
    difficulty: 'intermediate',
    order: 6,
    estimatedTime: 40,
    lessons: [
      { id: 'simv-mechanics', title: 'Mecánica de SIMV', slug: 'mecanica-simv', order: 1, estimatedTime: 40 },
    ],
  },

  // ========================================
  // ADVANCED (4 modules, 7 lessons)
  // ========================================
  {
    id: 'ards-management',
    levelId: 'level-avanzado',
    title: 'Manejo de ARDS y Estrategias de Protección Pulmonar',
    description: 'Protocolo ARDSnet, implementación de estrategias de protección pulmonar y manejo de complicaciones',
    difficulty: 'advanced',
    order: 1,
    estimatedTime: 90,
    lessons: [
      { id: 'ardsnet-protocol', title: 'Protocolo ARDSnet', slug: 'protocolo-ardsnet', order: 1, estimatedTime: 30 },
      { id: 'lung-protection', title: 'Simulación de Protección Pulmonar', slug: 'proteccion-pulmonar', order: 2, estimatedTime: 60 },
    ],
  },
  {
    id: 'copd-management',
    levelId: 'level-avanzado',
    title: 'Manejo Ventilatorio en EPOC',
    description: 'Particularidades del EPOC, estrategias ventilatorias específicas y manejo de auto-PEEP',
    difficulty: 'advanced',
    order: 2,
    estimatedTime: 85,
    lessons: [
      { id: 'copd-physiology', title: 'Fisiopatología del EPOC', slug: 'fisiopatologia-epoc', order: 1, estimatedTime: 35 },
      { id: 'copd-simulation', title: 'Simulación EPOC', slug: 'simulacion-epoc', order: 2, estimatedTime: 50 },
    ],
  },
  {
    id: 'asthma-crisis',
    levelId: 'level-avanzado',
    title: 'Manejo de Crisis Asmática',
    description: 'Ventilación permisiva y manejo de complicaciones ventilatorias en crisis asmática severa',
    difficulty: 'advanced',
    order: 3,
    estimatedTime: 45,
    lessons: [
      { id: 'asthma-crisis-case', title: 'Caso Clínico: Crisis Asmática', slug: 'caso-crisis-asmatica', order: 1, estimatedTime: 45 },
    ],
  },
  {
    id: 'clinical-cases',
    levelId: 'level-avanzado',
    title: 'Casos Clínicos Complejos',
    description: 'Integración de conocimientos en casos clínicos complejos con múltiples patologías',
    difficulty: 'advanced',
    order: 4,
    estimatedTime: 120,
    lessons: [
      { id: 'complex-case-1', title: 'Paciente con ARDS + Sepsis', slug: 'ards-sepsis', order: 1, estimatedTime: 60 },
      { id: 'complex-case-2', title: 'Paciente Post-Quirúrgico con Complicaciones', slug: 'post-quirurgico', order: 2, estimatedTime: 60 },
    ],
  },
];

// --- LEVEL PREREQUISITES ---
// Each level requires completion of the previous main level
const LEVEL_PREREQUISITES = [
  { levelId: 'level-intermedio', prerequisiteLevelId: 'level-beginner' },
  { levelId: 'level-avanzado', prerequisiteLevelId: 'level-intermedio' },
  // Note: level-prerequisitos has no prerequisites (always accessible)
  // Note: level-beginner has no prerequisites (always accessible)
];

// --- MODULE PREREQUISITES (within-level sequential chains) ---
const MODULE_PREREQUISITES = [
  // Intermediate: sequential progression
  { moduleId: 'module-02-modalidades-parametros', prerequisiteId: 'principles-mechanical-ventilation' },
  { moduleId: 'volume-control', prerequisiteId: 'module-02-modalidades-parametros' },
  { moduleId: 'pressure-control', prerequisiteId: 'volume-control' },
  { moduleId: 'psv-mode', prerequisiteId: 'pressure-control' },
  { moduleId: 'simv-mode', prerequisiteId: 'psv-mode' },
  // Advanced: sequential progression
  { moduleId: 'copd-management', prerequisiteId: 'ards-management' },
  { moduleId: 'asthma-crisis', prerequisiteId: 'copd-management' },
  { moduleId: 'clinical-cases', prerequisiteId: 'asthma-crisis' },
  // Beginner: no module prerequisites (sequential access enforced by order)
  // Prerequisitos: no module prerequisites (all accessible)
];

// ============================================
// 2. SEED FUNCTIONS
// ============================================

/**
 * Phase 1: Truncate content tables in FK-safe order.
 * NEVER touches: users, accounts, sessions, quizzes, clinical_cases, etc.
 */
async function truncateContentTables() {
  console.log('\n🗑️  Phase 1: Truncating content tables...');

  // Use raw SQL TRUNCATE CASCADE for PostgreSQL
  // Order matters: children first, then parents
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      lesson_completions,
      user_progress,
      lesson_progress,
      learning_progress,
      steps,
      lessons,
      module_prerequisites,
      modules,
      level_prerequisites,
      levels
    CASCADE
  `);

  console.log('   ✅ Content tables truncated (progress tables cleared too - no users exist)');
}

/**
 * Phase 2a: Seed levels
 */
async function seedLevels() {
  console.log('\n📚 Phase 2a: Seeding levels...');

  for (const level of LEVELS) {
    await prisma.level.create({
      data: {
        id: level.id,
        title: level.title,
        description: level.description,
        order: level.order,
        isActive: true,
      },
    });
    console.log(`   ✅ Level: "${level.title}" (${level.id})`);
  }
}

/**
 * Phase 2b: Seed modules (with levelId FK)
 */
async function seedModules() {
  console.log('\n📖 Phase 2b: Seeding modules...');

  for (const mod of MODULES) {
    await prisma.module.create({
      data: {
        id: mod.id,
        levelId: mod.levelId,
        title: mod.title,
        description: mod.description,
        difficulty: mod.difficulty,
        order: mod.order,
        estimatedTime: mod.estimatedTime,
        isActive: true,
      },
    });
    console.log(`   ✅ Module: "${mod.title}" → ${mod.levelId} (order: ${mod.order})`);
  }
}

/**
 * Phase 2c: Seed lessons (with moduleId FK and slug)
 */
async function seedLessons() {
  console.log('\n📄 Phase 2c: Seeding lessons...');

  let totalLessons = 0;

  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      await prisma.lesson.create({
        data: {
          id: lesson.id,
          moduleId: mod.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          estimatedTime: lesson.estimatedTime,
          isActive: true,
        },
      });
      totalLessons++;
    }
    console.log(`   ✅ ${mod.id}: ${mod.lessons.length} lesson(s)`);
  }

  console.log(`   📊 Total lessons created: ${totalLessons}`);
}

/**
 * Phase 2d: Seed level prerequisites
 */
async function seedLevelPrerequisites() {
  console.log('\n🔗 Phase 2d: Seeding level prerequisites...');

  for (const prereq of LEVEL_PREREQUISITES) {
    await prisma.levelPrerequisite.create({
      data: {
        levelId: prereq.levelId,
        prerequisiteLevelId: prereq.prerequisiteLevelId,
      },
    });
    console.log(`   ✅ ${prereq.levelId} requires ${prereq.prerequisiteLevelId}`);
  }
}

/**
 * Phase 2e: Seed module prerequisites
 */
async function seedModulePrerequisites() {
  console.log('\n🔗 Phase 2e: Seeding module prerequisites...');

  for (const prereq of MODULE_PREREQUISITES) {
    await prisma.modulePrerequisite.create({
      data: {
        moduleId: prereq.moduleId,
        prerequisiteId: prereq.prerequisiteId,
      },
    });
    console.log(`   ✅ ${prereq.moduleId} requires ${prereq.prerequisiteId}`);
  }
}

// ============================================
// 3. VALIDATION
// ============================================

async function validate() {
  console.log('\n🔍 Phase 3: Validating...');

  const levelCount = await prisma.level.count();
  const moduleCount = await prisma.module.count();
  const lessonCount = await prisma.lesson.count();
  const levelPrereqCount = await prisma.levelPrerequisite.count();
  const modulePrereqCount = await prisma.modulePrerequisite.count();

  const expectedLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);

  console.log(`   Levels:              ${levelCount} (expected: ${LEVELS.length})`);
  console.log(`   Modules:             ${moduleCount} (expected: ${MODULES.length})`);
  console.log(`   Lessons:             ${lessonCount} (expected: ${expectedLessons})`);
  console.log(`   Level prerequisites: ${levelPrereqCount} (expected: ${LEVEL_PREREQUISITES.length})`);
  console.log(`   Module prerequisites:${modulePrereqCount} (expected: ${MODULE_PREREQUISITES.length})`);

  // Check for orphaned modules (no level)
  const orphanedModules = await prisma.module.count({ where: { levelId: null } });
  if (orphanedModules > 0) {
    console.warn(`   ⚠️  ${orphanedModules} modules have no level assigned!`);
  }

  // Check for orphaned lessons (no module)
  const orphanedLessons = await prisma.lesson.findMany({
    where: { module: { isActive: false } },
    select: { id: true, moduleId: true },
  });
  if (orphanedLessons.length > 0) {
    console.warn(`   ⚠️  ${orphanedLessons.length} lessons belong to inactive modules`);
  }

  // Check modules per level
  for (const level of LEVELS) {
    const count = await prisma.module.count({ where: { levelId: level.id } });
    const expected = MODULES.filter(m => m.levelId === level.id).length;
    const status = count === expected ? '✅' : '❌';
    console.log(`   ${status} ${level.title}: ${count} modules (expected: ${expected})`);
  }

  // Verify no duplicate slugs within same module
  const duplicateSlugs = await prisma.$queryRaw<{ moduleId: string; slug: string; cnt: number }[]>`
    SELECT "moduleId", slug, COUNT(*)::int as cnt
    FROM lessons
    WHERE slug IS NOT NULL
    GROUP BY "moduleId", slug
    HAVING COUNT(*) > 1
  `;
  if (duplicateSlugs.length > 0) {
    console.error('   ❌ Duplicate slugs found:', duplicateSlugs);
  } else {
    console.log('   ✅ No duplicate slugs within modules');
  }

  const allPassed =
    levelCount === LEVELS.length &&
    moduleCount === MODULES.length &&
    lessonCount === expectedLessons &&
    orphanedModules === 0 &&
    duplicateSlugs.length === 0;

  if (allPassed) {
    console.log('\n   🎉 All validations passed!');
  } else {
    console.error('\n   ❌ Some validations failed - review output above');
  }
}

// ============================================
// 4. MAIN
// ============================================

async function main() {
  console.log('🌱 VentyLab Curriculum Seed');
  console.log('============================');
  console.log(`Levels: ${LEVELS.length}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${MODULES.reduce((s, m) => s + m.lessons.length, 0)}`);
  console.log(`Level prerequisites: ${LEVEL_PREREQUISITES.length}`);
  console.log(`Module prerequisites: ${MODULE_PREREQUISITES.length}`);

  await truncateContentTables();
  await seedLevels();
  await seedModules();
  await seedLessons();
  await seedLevelPrerequisites();
  await seedModulePrerequisites();
  await validate();

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
