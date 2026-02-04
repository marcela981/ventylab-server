
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for VentyLab
 * Creates the curriculum modules in the database with explicit IDs
 *
 * IMPORTANT: Module IDs must match those defined in src/config/curriculumData.ts
 * The modules use explicit IDs (not auto-generated CUIDs) for curriculum integration.
 */

// Beginner modules - order matches BEGINNER_MODULES in curriculumData.ts
const BEGINNER_MODULES = [
  {
    id: 'module-01-inversion-fisiologica',
    title: 'Inversión Fisiológica',
    description: 'Fundamentos de la inversión fisiológica en ventilación mecánica',
    order: 1,
    difficulty: 'beginner',
    estimatedTime: 45,
  },
  {
    id: 'module-02-ecuacion-movimiento',
    title: 'Ecuación de Movimiento',
    description: 'Principios de la ecuación de movimiento respiratorio',
    order: 2,
    difficulty: 'beginner',
    estimatedTime: 60,
  },
  {
    id: 'module-03-variables-fase',
    title: 'Variables de Fase',
    description: 'Análisis de las variables de fase en el ciclo ventilatorio',
    order: 3,
    difficulty: 'beginner',
    estimatedTime: 50,
  },
  {
    id: 'module-04-modos-ventilatorios',
    title: 'Modos Ventilatorios',
    description: 'Comprensión de los diferentes modos de ventilación mecánica',
    order: 4,
    difficulty: 'beginner',
    estimatedTime: 90,
  },
  {
    id: 'module-05-monitorizacion-grafica',
    title: 'Monitorización Gráfica',
    description: 'Interpretación de curvas y gráficos ventilatorios',
    order: 5,
    difficulty: 'beginner',
    estimatedTime: 75,
  },
  {
    id: 'module-06-efectos-sistemicos',
    title: 'Efectos Sistémicos',
    description: 'Efectos sistémicos de la ventilación mecánica',
    order: 6,
    difficulty: 'beginner',
    estimatedTime: 60,
  },
];

// Prerequisitos modules - optional level
const PREREQUISITOS_MODULES = [
  {
    id: 'module-00-anatomia-respiratoria',
    title: 'Anatomía Respiratoria',
    description: 'Revisión de la anatomía del sistema respiratorio',
    order: 1,
    difficulty: 'prerequisitos',
    estimatedTime: 30,
  },
  {
    id: 'module-00-fisiologia-basica',
    title: 'Fisiología Básica',
    description: 'Conceptos básicos de fisiología respiratoria',
    order: 2,
    difficulty: 'prerequisitos',
    estimatedTime: 40,
  },
];

async function seedModules() {
  console.log('🌱 Seeding curriculum modules...');

  const allModules = [...PREREQUISITOS_MODULES, ...BEGINNER_MODULES];

  for (const moduleData of allModules) {
    const existing = await prisma.$queryRaw<[{ id: string }]>`
      SELECT id FROM modules WHERE id = ${moduleData.id} LIMIT 1
    `;

    const now = new Date();
    if (existing.length > 0) {
      console.log(`  ⏭️  Module "${moduleData.id}" already exists, updating...`);
      await prisma.$executeRaw`
        UPDATE modules SET
          title = ${moduleData.title},
          description = ${moduleData.description},
          "order" = ${moduleData.order},
          difficulty = ${moduleData.difficulty},
          "estimatedTime" = ${moduleData.estimatedTime},
          "isActive" = true,
          "updatedAt" = ${now}
        WHERE id = ${moduleData.id}
      `;
    } else {
      console.log(`  ✅ Creating module "${moduleData.id}"...`);
      await prisma.$executeRaw`
        INSERT INTO modules (id, title, description, "order", difficulty, "estimatedTime", "isActive", "createdAt", "updatedAt")
        VALUES (${moduleData.id}, ${moduleData.title}, ${moduleData.description}, ${moduleData.order}, ${moduleData.difficulty}, ${moduleData.estimatedTime}, true, ${now}, ${now})
      `;
    }
  }

  console.log('✅ Curriculum modules seeded successfully!');
}

async function main() {
  try {
    await seedModules();
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
