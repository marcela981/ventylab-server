/**
 * Curriculum Editor Controller
 *
 * HTTP handlers for the Notion-style CMS editor endpoints.
 * All routes require TEACHER or ADMIN role.
 *
 * Endpoints (mounted at /api/teaching):
 *   GET    /tree                    → Full recursive curriculum tree
 *   POST   /node                    → Create a level (or sublevel) / module
 *   PUT    /node/:id                → Update title, color, tags, order, isActive
 *   DELETE /node/:id                → Delete node + all descendants recursively
 *   GET    /lesson/:id/content      → Get lesson with Notion blocks
 *   PUT    /lesson/:id/content      → Save Notion blocks to a lesson
 */

import { Request, Response, NextFunction } from 'express';
import * as editorService from './curriculum-editor.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { HTTP_STATUS } from '../../config/constants';
import { AppError } from '../../shared/middleware/error-handler.middleware';

// ─── GET /api/teaching/tree ───────────────────────────────────────────────────

/**
 * Returns the full curriculum tree for the editor.
 * Optional query param: ?track=mecanica|ventylab
 */
export const getCurriculumTree = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const track = typeof req.query.track === 'string' ? req.query.track : undefined;
    const tree = await editorService.getCurriculumTree(track);
    sendSuccess(res, HTTP_STATUS.OK, 'Árbol del currículo obtenido', tree);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/teaching/node ──────────────────────────────────────────────────

/**
 * Creates a new node (level, sublevel or module).
 *
 * Body:
 * ```json
 * {
 *   "type": "level" | "module",
 *   "title": "...",
 *   "parentId": "...",   // For type=level: creates a sublevel under parentId
 *   "levelId": "...",    // For type=module: the parent level
 *   "track": "mecanica", // Defaults to "mecanica"
 *   "description": "...",
 *   "color": "#3B82F6",
 *   "tags": ["tag1"],
 *   "order": 0
 * }
 * ```
 */
export const createNode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, title, parentId, levelId, track, description, color, tags, order } = req.body;

    if (!type || !['level', 'module'].includes(type)) {
      throw new AppError(
        'El campo "type" debe ser "level" o "module"',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new AppError(
        'El campo "title" es obligatorio',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    const node = await editorService.createNode(
      { type, title: title.trim(), parentId, levelId, track, description, color, tags, order },
      req.user?.id
    );

    sendCreated(res, `${type === 'level' ? 'Nivel' : 'Módulo'} creado exitosamente`, node);
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/teaching/node/:id ───────────────────────────────────────────────

/**
 * Updates a node (level or module).
 *
 * Params: id
 * Query:  ?type=level|module  (required)
 * Body (all optional):
 * ```json
 * {
 *   "title": "...",
 *   "description": "...",
 *   "color": "#...",
 *   "tags": [],
 *   "order": 1,
 *   "isActive": true
 * }
 * ```
 */
export const updateNode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const typeParam = req.query.type as string | undefined;

    if (!typeParam || !['level', 'module'].includes(typeParam)) {
      throw new AppError(
        'El query param "type" debe ser "level" o "module"',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    const type = typeParam as editorService.NodeType;
    const { title, description, color, tags, order, isActive } = req.body;

    const node = await editorService.updateNode(
      id,
      type,
      { title, description, color, tags, order, isActive },
      req.user?.id
    );

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${type === 'level' ? 'Nivel' : 'Módulo'} actualizado exitosamente`,
      node
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/teaching/node/:id ────────────────────────────────────────────

/**
 * Deletes a node and all its descendants recursively.
 *
 * Params: id
 * Query:  ?type=level|module  (required)
 *
 * WARNING: This permanently deletes all child nodes, modules, lessons, steps,
 * quizzes, and student progress records under the deleted node.
 */
export const deleteNode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const typeParam = req.query.type as string | undefined;

    if (!typeParam || !['level', 'module'].includes(typeParam)) {
      throw new AppError(
        'El query param "type" debe ser "level" o "module"',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    const type = typeParam as editorService.NodeType;
    const result = await editorService.deleteNode(id, type, req.user?.id);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      `${type === 'level' ? 'Nivel' : 'Módulo'} eliminado recursivamente`,
      result
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/teaching/lesson/:id/content ─────────────────────────────────────

/**
 * Returns a lesson with its full Notion blocks content.
 * Params: id (lessonId)
 */
export const getLessonContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await editorService.getLessonWithBlocks(id);
    sendSuccess(res, HTTP_STATUS.OK, 'Contenido de la lección obtenido', lesson);
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/teaching/lesson/:id/content ─────────────────────────────────────

/**
 * Saves the Notion-style blocks array to a lesson.
 *
 * Params: id (lessonId)
 * Body:
 * ```json
 * {
 *   "blocks": [
 *     { "type": "paragraph", "content": "..." },
 *     { "type": "image", "url": "...", "caption": "..." },
 *     { "type": "quiz", "question": "...", "options": [...] }
 *   ]
 * }
 * ```
 */
export const saveLessonContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      throw new AppError(
        'El campo "blocks" debe ser un array',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    const lesson = await editorService.saveLessonBlocks(id, blocks, req.user?.id);
    sendSuccess(res, HTTP_STATUS.OK, 'Contenido de la lección guardado', lesson);
  } catch (error) {
    next(error);
  }
};
