/**
 * Curriculum Controller
 * Handles HTTP requests for curriculum-related operations
 * Provides explicit module ordering based on curriculumData configuration
 */

import { Request, Response, NextFunction } from 'express';
import * as curriculumService from '../services/curriculum';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';
import { CURRICULUM_LEVELS, CurriculumLevel } from '../config/curriculumData';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get beginner level modules
 * GET /api/curriculum/beginner
 * Returns exactly 6 modules in the explicit order defined in curriculumData
 */
export const getBeginnerModules = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await curriculumService.getBeginnerCurriculumModules(userId);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      'Módulos del nivel principiante obtenidos exitosamente',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get prerequisitos level modules (optional)
 * GET /api/curriculum/prerequisitos
 * These modules do NOT affect beginner unlocking or navigation
 */
export const getPrerequisitosModules = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await curriculumService.getPrerequisitosModules(userId);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      'Módulos de prerequisitos obtenidos exitosamente',
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get modules by curriculum level
 * GET /api/curriculum/level/:level
 */
export const getModulesByLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { level } = req.params;
    const userId = req.user?.id;

    // Validate level
    const validLevels = Object.values(CURRICULUM_LEVELS);
    if (!validLevels.includes(level as CurriculumLevel)) {
      sendSuccess(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Nivel inválido. Debe ser uno de: ${validLevels.join(', ')}`,
        null
      );
      return;
    }

    const result = await curriculumService.getCurriculumModulesByLevel(
      level as CurriculumLevel,
      userId
    );

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      `Módulos del nivel ${level} obtenidos exitosamente`,
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a module is unlocked for the current user
 * GET /api/curriculum/modules/:moduleId/unlocked
 */
export const checkModuleUnlocked = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado', null);
      return;
    }

    const isUnlocked = await curriculumService.isModuleUnlocked(userId, moduleId);

    sendSuccess(res, HTTP_STATUS.OK, 'Estado de desbloqueo obtenido', {
      moduleId,
      isUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get next module for navigation after completing current module
 * GET /api/curriculum/modules/:moduleId/next
 * IMPORTANT: Never returns prerequisitos modules
 */
export const getNextModule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado', null);
      return;
    }

    const nextModule = await curriculumService.getNextModuleForNavigation(
      userId,
      moduleId
    );

    if (!nextModule) {
      sendSuccess(res, HTTP_STATUS.OK, 'No hay módulo siguiente disponible', {
        currentModuleId: moduleId,
        nextModule: null,
      });
      return;
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Módulo siguiente obtenido', {
      currentModuleId: moduleId,
      nextModule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get curriculum overview with all levels
 * GET /api/curriculum/overview
 */
export const getCurriculumOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Get beginner and prerequisitos levels
    const [beginner, prerequisitos] = await Promise.all([
      curriculumService.getBeginnerCurriculumModules(userId),
      curriculumService.getPrerequisitosModules(userId),
    ]);

    const overview = {
      levels: [
        {
          ...prerequisitos,
          isOptional: true,
          affectsUnlocking: false,
        },
        {
          ...beginner,
          isOptional: false,
          affectsUnlocking: true,
        },
      ],
      totalModules: beginner.totalModules + prerequisitos.totalModules,
      mainLevelModules: beginner.totalModules, // Only count non-optional
    };

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      'Vista general del curriculum obtenida',
      overview
    );
  } catch (error) {
    next(error);
  }
};
