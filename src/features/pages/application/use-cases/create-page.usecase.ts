/*
 * Funcionalidad: Caso de uso CreatePageUseCase
 * Descripción: Crea una página en una lección (el módulo se deriva de la lección), con slug único en el módulo, orden al final del módulo y estado DRAFT por defecto; depende de IPageRepository, ILessonRepository, ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { CreatePageCommand } from "@/features/pages/application/commands/create-page.command";
import { Page } from "@/features/pages/domain/entities/page.entity";
import { PageSlugAlreadyExistsError } from "@/features/pages/domain/pages.errors";
import { type IPageRepository, PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";
import { slugify } from "@/features/pages/domain/services/page-slug";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {PageSlugAlreadyExistsError} If another page of the module already has the slug
 */
@Injectable()
export class CreatePageUseCase {
  public constructor(
    @Inject(PAGES_REPOSITORY_TOKEN)
    private readonly _pagesRepository: IPageRepository,
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: CreatePageCommand): Promise<string> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<string> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      const slug: string = command.slug ?? slugify(command.title);

      if (await this._pagesRepository.existsWithSlugInModule(lesson.moduleId, slug, undefined, transaction)) {
        throw new PageSlugAlreadyExistsError();
      }

      const order: number = ((await this._pagesRepository.getMaxOrderInModule(lesson.moduleId, transaction)) ?? -1) + 1;

      const page: Page = Page.create({
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
        title: command.title,
        slug,
        order,
        fields: command.fields,
        performedBy: command.performedBy,
      });

      await this._pagesRepository.save(page, transaction);

      return page.id;
    });
  }
}
