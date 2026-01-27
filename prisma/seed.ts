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

  // Seed beginner modules
  for (const moduleData of BEGINNER_MODULES) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleData.id },
    });

    if (existing) {
      console.log(`  ⏭️  Module "${moduleData.id}" already exists, updating...`);
      await prisma.module.update({
        where: { id: moduleData.id },
        data: {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          difficulty: moduleData.difficulty,
          estimatedTime: moduleData.estimatedTime,
          isActive: true,
        },
      });
    } else {
      console.log(`  ✅ Creating module "${moduleData.id}"...`);
      await prisma.module.create({
        data: {
          id: moduleData.id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          difficulty: moduleData.difficulty,
          estimatedTime: moduleData.estimatedTime,
          isActive: true,
        },
      });
    }
  }

  // Seed prerequisitos modules
  for (const moduleData of PREREQUISITOS_MODULES) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleData.id },
    });

    if (existing) {
      console.log(`  ⏭️  Module "${moduleData.id}" already exists, updating...`);
      await prisma.module.update({
        where: { id: moduleData.id },
        data: {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          difficulty: moduleData.difficulty,
          estimatedTime: moduleData.estimatedTime,
          isActive: true,
        },
      });
    } else {
      console.log(`  ✅ Creating module "${moduleData.id}"...`);
      await prisma.module.create({
        data: {
          id: moduleData.id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
          difficulty: moduleData.difficulty,
          estimatedTime: moduleData.estimatedTime,
          isActive: true,
        },
      });
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
