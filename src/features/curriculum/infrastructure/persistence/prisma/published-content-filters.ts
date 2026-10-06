/*
 * Funcionalidad: Filtros Prisma de contenido publicado
 * Descripción: Construye los filtros Prisma que restringen niveles, módulos, lecciones y páginas a los publicados cuyos ancestros (Sección, Nivel, Módulo, Lección) también están publicados; los usan los repositorios de lectura de las features curriculares para los estudiantes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

export function publishedLevelWhere(): Prisma.LevelWhereInput {
  return {
    status: "PUBLISHED",
    OR: [{ sectionId: null }, { section: { status: "PUBLISHED" } }],
  };
}

export function publishedModuleWhere(): Prisma.ModuleWhereInput {
  return {
    status: "PUBLISHED",
    OR: [{ levelId: null }, { level: publishedLevelWhere() }],
  };
}

export function publishedLessonWhere(): Prisma.LessonWhereInput {
  return {
    status: "PUBLISHED",
    module: publishedModuleWhere(),
  };
}

export function publishedPageWhere(): Prisma.PageWhereInput {
  return {
    status: "PUBLISHED",
    module: publishedModuleWhere(),
    OR: [{ lessonId: null }, { lesson: { status: "PUBLISHED" } }],
  };
}

export function visibleLevelWhere(canManage: boolean): Prisma.LevelWhereInput {
  return canManage ? {} : publishedLevelWhere();
}

export function visibleModuleWhere(canManage: boolean): Prisma.ModuleWhereInput {
  return canManage ? {} : publishedModuleWhere();
}

export function visibleLessonWhere(canManage: boolean): Prisma.LessonWhereInput {
  return canManage ? {} : publishedLessonWhere();
}

export function visiblePageWhere(canManage: boolean): Prisma.PageWhereInput {
  return canManage ? {} : publishedPageWhere();
}
