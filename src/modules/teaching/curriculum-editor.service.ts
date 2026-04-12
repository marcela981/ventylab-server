/**
 * Curriculum Editor Service
 *
 * Business logic for the Notion-style CMS editor (TEACHER/ADMIN only).
 *
 * Responsibilities:
 * - Build the recursive curriculum tree (Level → children* → Module → Lesson)
 * - CRUD for "nodes" (Level or Module) with full recursive delete
 * - Save/retrieve Notion-style block content on Lessons
 */

import { prisma } from '../../shared/infrastructure/database';
import { AppError } from '../../shared/middleware/error-handler.middleware';
import { HTTP_STATUS } from '../../config/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeType = 'level' | 'module';

export interface CreateNodeInput {
  type: NodeType;
  title: string;
  /** For type=level: parent level ID (creates a sublevel). Omit for root level. */
  parentId?: string;
  /** For type=module: the level (or sublevel) that owns this module. Required. */
  levelId?: string;
  track?: string;
  description?: string;
  color?: string;
  tags?: string[];
  order?: number;
}

export interface UpdateNodeInput {
  title?: string;
  description?: string;
  color?: string;
  tags?: string[];
  order?: number;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  order: number;
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

/**
 * Returns the full curriculum tree for the editor.
 *
 * Shape:
 * ```
 * Level (root, parentId = null)
 *   └─ Level (sublevel, parentId = rootId)
 *        └─ Module
 *             └─ Lesson  (title, id, order, color, tags, blocks summary)
 * ```
 *
 * Track filter is optional (defaults to all tracks).
 */
export async function getCurriculumTree(track?: string) {
  // 1. Fetch every level (we'll assemble the tree in memory)
  const allLevels = await prisma.level.findMany({
    where: track ? { track } : undefined,
    orderBy: { order: 'asc' },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              slug: true,
              order: true,
              color: true,
              tags: true,
              isActive: true,
              estimatedTime: true,
              // Return only whether blocks exist, not the full JSON (can be large)
              blocks: true,
            },
          },
        },
      },
    },
  });

  // 2. Build id→node map
  const levelMap = new Map<string, typeof allLevels[number] & { children: unknown[] }>();
  for (const lvl of allLevels) {
    levelMap.set(lvl.id, { ...lvl, children: [] });
  }

  // 3. Nest children under parents
  const roots: (typeof allLevels[number] & { children: unknown[] })[] = [];
  for (const lvl of allLevels) {
    const node = levelMap.get(lvl.id)!;
    if (lvl.parentId && levelMap.has(lvl.parentId)) {
      levelMap.get(lvl.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── Create node ──────────────────────────────────────────────────────────────

export async function createNode(input: CreateNodeInput, userId?: string) {
  if (input.type === 'level') {
    // Validate parent exists when provided
    if (input.parentId) {
      const parent = await prisma.level.findUnique({ where: { id: input.parentId } });
      if (!parent) {
        throw new AppError('Nivel padre no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
      }
    }

    const maxOrder = await prisma.level.aggregate({
      where: { parentId: input.parentId ?? null },
      _max: { order: true },
    });
    const nextOrder = input.order ?? (maxOrder._max.order ?? -1) + 1;

    return prisma.level.create({
      data: {
        title: input.title,
        description: input.description,
        track: input.track ?? 'mecanica',
        color: input.color,
        tags: input.tags ?? [],
        order: nextOrder,
        parentId: input.parentId ?? null,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
    });
  }

  // type === 'module'
  if (!input.levelId) {
    throw new AppError(
      'Se requiere levelId para crear un módulo',
      HTTP_STATUS.BAD_REQUEST,
      'VALIDATION_ERROR'
    );
  }

  const level = await prisma.level.findUnique({ where: { id: input.levelId } });
  if (!level) {
    throw new AppError('Nivel no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  const maxOrder = await prisma.module.aggregate({
    where: { levelId: input.levelId },
    _max: { order: true },
  });
  const nextOrder = input.order ?? (maxOrder._max.order ?? -1) + 1;

  return prisma.module.create({
    data: {
      title: input.title,
      description: input.description,
      color: input.color,
      tags: input.tags ?? [],
      order: nextOrder,
      levelId: input.levelId,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    },
  });
}

// ─── Update node ──────────────────────────────────────────────────────────────

export async function updateNode(
  id: string,
  type: NodeType,
  input: UpdateNodeInput,
  userId?: string
) {
  if (type === 'level') {
    const level = await prisma.level.findUnique({ where: { id } });
    if (!level) {
      throw new AppError('Nivel no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
    return prisma.level.update({
      where: { id },
      data: {
        ...input,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
    });
  }

  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw new AppError('Módulo no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
  return prisma.module.update({
    where: { id },
    data: {
      ...input,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    },
  });
}

// ─── Delete node (recursive) ──────────────────────────────────────────────────

/**
 * Deletes a node and all its descendants.
 *
 * Level deletion cascades through:
 *   Level → children levels (recursive) → modules → lessons → steps, quizzes, completions…
 *
 * Module deletion cascades through:
 *   Module → lessons → steps, quizzes, completions…
 *
 * DB-level `onDelete: Cascade` handles deep children automatically once the
 * top-level record is deleted. For Level children (self-referencing with
 * onDelete: SetNull) we delete them explicitly first.
 */
export async function deleteNode(id: string, type: NodeType, userId?: string) {
  if (type === 'level') {
    return deleteLevel(id, userId);
  }

  // Module: Prisma cascade covers lessons → steps, quizzes, etc.
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw new AppError('Módulo no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
  await prisma.module.delete({ where: { id } });
  return { deleted: true, type: 'module', id };
}

async function deleteLevel(id: string, userId?: string): Promise<{ deleted: boolean; type: string; id: string }> {
  const level = await prisma.level.findUnique({ where: { id } });
  if (!level) {
    throw new AppError('Nivel no encontrado', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  // Find and recursively delete all children first (parentId uses SetNull, not Cascade)
  const children = await prisma.level.findMany({ where: { parentId: id } });
  for (const child of children) {
    await deleteLevel(child.id, userId);
  }

  // Now delete this level (Prisma cascade deletes its modules → lessons → steps etc.)
  await prisma.level.delete({ where: { id } });
  return { deleted: true, type: 'level', id };
}

// ─── Lesson content (Notion blocks) ──────────────────────────────────────────

/**
 * Saves the Notion-style blocks array on a Lesson.
 * blocks: Array of block objects — validated/serialized by the caller.
 */
export async function saveLessonBlocks(
  lessonId: string,
  blocks: unknown[],
  userId?: string
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw new AppError('Lección no encontrada', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      blocks: blocks as never,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      blocks: true,
      updatedAt: true,
    },
  });
}

/**
 * Returns a lesson with its full blocks content (for the editor).
 */
export async function getLessonWithBlocks(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      slug: true,
      color: true,
      tags: true,
      blocks: true,
      estimatedTime: true,
      isActive: true,
      moduleId: true,
      updatedAt: true,
    },
  });
  if (!lesson) {
    throw new AppError('Lección no encontrada', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
  return lesson;
}
