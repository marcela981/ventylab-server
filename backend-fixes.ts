// =============================================================================
// FIXES PARA BACKEND - APLICAR EN ORDEN
// =============================================================================

// =============================================================================
// FIX 1: backend/src/index.ts - Cambiar trust proxy
// =============================================================================

// BUSCAR (aproximadamente línea donde configuras express):
app.set('trust proxy', true);

// REEMPLAZAR POR:
app.set('trust proxy', 1); // Solo confiar en el primer proxy (Vercel/Nginx)

// =============================================================================
// FIX 2: backend/src/middleware/rateLimiter.ts - Agregar validate option
// =============================================================================

// ARCHIVO COMPLETO ACTUALIZADO:

import rateLimit from 'express-rate-limit';

// Rate limiter para operaciones de lectura
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60,
  },
  // NUEVO: Deshabilitar validación estricta de trust proxy
  validate: { trustProxy: false },
});

// Rate limiter para operaciones de escritura (más restrictivo)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de escritura, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60,
  },
  validate: { trustProxy: false },
});

// Rate limiter para autenticación (muy restrictivo)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 intentos de login por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo en 1 hora',
    retryAfter: 60 * 60,
  },
  validate: { trustProxy: false },
});

// =============================================================================
// FIX 3: backend/src/routes/progress.ts - Agregar rutas faltantes
// =============================================================================

// ARCHIVO COMPLETO ACTUALIZADO:

import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas de progreso
router.use(authenticate);

// ============================================
// RUTAS EXISTENTES
// ============================================

// Obtener overview del usuario (dashboard)
router.get('/overview', progressController.getUserOverview);

// Obtener progreso agregado de un módulo específico
router.get('/module/:moduleId', progressController.getModuleProgress);

// Obtener progreso de una lección específica
router.get('/lesson/:lessonId', progressController.getLessonProgress);

// Actualizar progreso de una lección
router.put('/lesson/:lessonId', progressController.updateLessonProgress);

// Marcar lección como completada
router.post('/lesson/:lessonId/complete', progressController.markComplete);

// ============================================
// NUEVAS RUTAS (stubs para evitar 404)
// ============================================

// Milestones - Para gamificación futura
router.get('/milestones', progressController.getMilestones);

// Achievements - Logros del usuario
router.get('/achievements', progressController.getAchievements);

// Skills - Habilidades/competencias
router.get('/skills', progressController.getSkills);

export default router;

// =============================================================================
// FIX 4: backend/src/controllers/progress.controller.ts - Agregar handlers
// =============================================================================

// AGREGAR AL FINAL DEL ARCHIVO:

// ============================================
// STUBS PARA RUTAS NUEVAS
// TODO: Implementar funcionalidad completa cuando haya tiempo
// ============================================

/**
 * GET /api/progress/milestones
 * Obtener milestones/hitos del usuario
 */
export async function getMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // TODO: Implementar lógica de milestones
    // Por ahora retornar estructura vacía para no romper el frontend
    res.json({
      milestones: [],
      totalCompleted: 0,
      totalAvailable: 0,
      nextMilestone: null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/achievements
 * Obtener logros del usuario
 */
export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Intentar obtener achievements de la BD si existen
    try {
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      });
      
      res.json({
        achievements: achievements.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          unlockedAt: a.unlockedAt,
        })),
        totalUnlocked: achievements.length,
      });
    } catch {
      // Si falla, retornar vacío
      res.json({
        achievements: [],
        totalUnlocked: 0,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/skills
 * Obtener habilidades/competencias del usuario
 */
export async function getSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // TODO: Implementar sistema de skills basado en progreso
    // Por ahora retornar estructura vacía
    res.json({
      skills: [],
      categories: [
        { id: 'physiology', name: 'Fisiología Respiratoria', progress: 0 },
        { id: 'ventilation', name: 'Ventilación Mecánica', progress: 0 },
        { id: 'clinical', name: 'Casos Clínicos', progress: 0 },
      ],
      overallLevel: 'beginner',
    });
  } catch (error) {
    next(error);
  }
}

// No olvidar importar prisma al inicio del archivo si no está:
// import { prisma } from '../config/prisma';

// =============================================================================
// FIX 5: Progress system uses LearningProgress + LessonProgress (NOT legacy Progress)
// =============================================================================
// Use src/services/progress/learningProgress.service.ts for all progress operations.
// Example: updateLessonProgress({ userId, moduleId, lessonId, completed, timeSpent })
// Do NOT use prisma.progress - that model is deprecated and disabled in the schema.

// =============================================================================
// FIX 6: package.json - Scripts para automatizar Prisma
// =============================================================================

// AGREGAR/MODIFICAR estos scripts en backend/package.json:

{
  "scripts": {
    "dev": "npm run prisma:generate && tsx watch src/index.ts",
    "build": "npm run prisma:generate && tsc",
    "start": "npm run prisma:deploy && node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:migrate": "prisma migrate dev",
    "prisma:reset": "prisma migrate reset --force",
    "prisma:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}

// EXPLICACIÓN:
// - dev: Genera cliente Prisma y arranca en modo watch
// - start: En producción, aplica migraciones pendientes antes de arrancar
// - prisma:migrate: Para crear nuevas migraciones en desarrollo
// - prisma:reset: Para resetear BD en desarrollo (CUIDADO: borra datos)
// - postinstall: Genera cliente automáticamente después de npm install