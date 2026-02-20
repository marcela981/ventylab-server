/**
 * Page Service - Phase 1 Content Hierarchy
 *
 * Serves Page + PageSection content from the database.
 * Coexists with existing Lesson/Step system.
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants';

/**
 * Get a Page by ID with all its active sections, ordered.
 * This is the primary endpoint for rendering a lesson from the database.
 */
export const getPageById = async (pageId: string) => {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      module: {
        select: {
          id: true,
          title: true,
          levelId: true,
          isActive: true,
        },
      },
    },
  });

  if (!page) {
    throw new AppError(
      'Página no encontrada',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.PAGE_NOT_FOUND
    );
  }

  if (!page.isActive) {
    throw new AppError(
      'Esta página no está disponible',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.PAGE_NOT_FOUND
    );
  }

  if (!page.module.isActive) {
    throw new AppError(
      'El módulo de esta página no está disponible',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.MODULE_INACTIVE
    );
  }

  return page;
};

/**
 * Get a Page by its legacy JSON id (e.g. "module-01-inversion-fisiologica").
 * Used by the coexistence resolver to check if a JSON lesson has been migrated.
 */
export const getPageByLegacyJsonId = async (legacyJsonId: string) => {
  const page = await prisma.page.findFirst({
    where: {
      legacyJsonId,
      isPublished: true,
      isActive: true,
    },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      module: {
        select: {
          id: true,
          title: true,
          levelId: true,
          isActive: true,
        },
      },
    },
  });

  return page; // null if not migrated yet
};

/**
 * Get a Page by its legacy Lesson ID.
 * Used by the coexistence resolver to check if a Lesson has a Page equivalent.
 */
export const getPageByLegacyLessonId = async (lessonId: string) => {
  const page = await prisma.page.findFirst({
    where: {
      legacyLessonId: lessonId,
      isPublished: true,
      isActive: true,
    },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      module: {
        select: {
          id: true,
          title: true,
          levelId: true,
          isActive: true,
        },
      },
    },
  });

  return page; // null if not migrated yet
};

/**
 * Coexistence resolver: determines whether a lesson should be served
 * from the new Page system or the old Lesson system.
 *
 * Returns { source: 'page', data: Page } if migrated,
 * or { source: 'lesson', lessonId: string } if not.
 */
export const getContentForLesson = async (lessonId: string) => {
  const includeClause = {
    sections: {
      where: { isActive: true },
      orderBy: { order: 'asc' as const },
    },
    module: {
      select: {
        id: true,
        title: true,
        levelId: true,
        isActive: true,
      },
    },
  };

  // 1. Try by legacyLessonId (DB Lesson ID)
  let page = await prisma.page.findFirst({
    where: {
      legacyLessonId: lessonId,
      isPublished: true,
      isActive: true,
    },
    include: includeClause,
  });

  // 2. Try by legacyJsonId (frontend sends the original JSON file ID)
  if (!page) {
    page = await prisma.page.findFirst({
      where: {
        legacyJsonId: lessonId,
        isPublished: true,
        isActive: true,
      },
      include: includeClause,
    });
  }

  if (page) {
    return { source: 'page' as const, data: page };
  }

  // Not migrated — caller should fall back to the old Lesson service
  return { source: 'lesson' as const, lessonId };
};

/**
 * List all pages in a module, ordered.
 */
export const getPagesByModuleId = async (moduleId: string) => {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, isActive: true },
  });

  if (!module) {
    throw new AppError(
      'Módulo no encontrado',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.MODULE_NOT_FOUND
    );
  }

  const pages = await prisma.page.findMany({
    where: {
      moduleId,
      isActive: true,
      isPublished: true,
    },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      order: true,
      type: true,
      difficulty: true,
      estimatedMinutes: true,
      learningObjectives: true,
      hasRequiredQuiz: true,
      legacyLessonId: true,
      legacyJsonId: true,
    },
  });

  return pages;
};
