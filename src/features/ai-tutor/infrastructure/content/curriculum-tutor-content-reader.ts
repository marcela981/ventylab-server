/*
 * Funcionalidad: Lector de contenido del currículo para el tutor
 * Descripción: Implementa ITutorContentReader con los casos de uso exportados por pages, lessons y modules (que aplican la visibilidad del lector): texto plano de una página con títulos de lección y módulo, páginas visibles de una lección y resumen de un módulo con sus lecciones y páginas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import {
  type ITutorContentReader,
  type TutorLessonOutline,
  type TutorModuleOutline,
  type TutorPageContent,
} from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { pageSectionsToPlainText } from "@/features/ai-tutor/domain/services/page-text";
import { GetLessonByIdUseCase } from "@/features/lessons/application/use-cases/get-lesson-by-id.usecase";
import { type LessonDetail } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { GetModuleByIdUseCase } from "@/features/modules/application/use-cases/get-module-by-id.usecase";
import { GetModuleLessonsUseCase } from "@/features/modules/application/use-cases/get-module-lessons.usecase";
import { type ModuleDetail, type ModuleLessonItem } from "@/features/modules/domain/read-models/module-views.read-model";
import { GetLessonPagesUseCase } from "@/features/pages/application/use-cases/get-lesson-pages.usecase";
import { GetModulePagesUseCase } from "@/features/pages/application/use-cases/get-module-pages.usecase";
import { GetPageByIdUseCase } from "@/features/pages/application/use-cases/get-page-by-id.usecase";
import { type PageSectionView, type PageSummary, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";

function byOrder<T extends { readonly order: number }>(items: readonly T[]): T[] {
  return [...items].sort((left: T, right: T) => left.order - right.order);
}

@Injectable()
export class CurriculumTutorContentReader implements ITutorContentReader {
  public constructor(
    private readonly _getPageByIdUseCase: GetPageByIdUseCase,
    private readonly _getLessonPagesUseCase: GetLessonPagesUseCase,
    private readonly _getModulePagesUseCase: GetModulePagesUseCase,
    private readonly _getLessonByIdUseCase: GetLessonByIdUseCase,
    private readonly _getModuleByIdUseCase: GetModuleByIdUseCase,
    private readonly _getModuleLessonsUseCase: GetModuleLessonsUseCase,
  ) {}

  public async getPage(pageId: string, canManage: boolean): Promise<TutorPageContent> {
    const page: PageView = await this._getPageByIdUseCase.execute(pageId, canManage);
    const lesson: LessonDetail | undefined = page.lessonId
      ? await this._getLessonByIdUseCase.execute(page.lessonId, canManage).catch(() => undefined)
      : undefined;
    const sections: PageSectionView[] = byOrder(page.sections.filter((section: PageSectionView) => section.isActive));
    const intro: string[] = [page.description ?? "", ...page.learningObjectives.map((objective: string) => `- ${objective}`)].filter(
      (line: string) => line.trim().length > 0,
    );

    return {
      id: page.id,
      title: page.title,
      text: pageSectionsToPlainText([{ content: intro.join("\n") }, ...sections.map((section: PageSectionView) => ({ title: section.title, content: section.content }))]),
      moduleId: page.moduleId,
      moduleTitle: page.module.title,
      lessonId: page.lessonId,
      lessonTitle: lesson?.title,
    };
  }

  public async getLessonOutline(lessonId: string, canManage: boolean): Promise<TutorLessonOutline> {
    const lesson: LessonDetail = await this._getLessonByIdUseCase.execute(lessonId, canManage);
    const pages: PageSummary[] = await this._getLessonPagesUseCase.execute(lessonId, canManage);

    return { id: lesson.id, title: lesson.title, moduleId: lesson.moduleId, pageIds: byOrder(pages).map((page: PageSummary) => page.id) };
  }

  public async getModuleOutline(moduleId: string, canManage: boolean): Promise<TutorModuleOutline> {
    const module: ModuleDetail = await this._getModuleByIdUseCase.execute(moduleId, canManage);
    const [lessons, pages] = await Promise.all([
      this._getModuleLessonsUseCase.execute(moduleId, canManage),
      this._getModulePagesUseCase.execute(moduleId, canManage),
    ]);

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      lessonTitles: byOrder(lessons).map((lesson: ModuleLessonItem) => lesson.title),
      pageIds: byOrder(pages).map((page: PageSummary) => page.id),
    };
  }
}
