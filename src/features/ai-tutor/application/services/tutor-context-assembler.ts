/*
 * Funcionalidad: Ensamblador de contexto del tutor
 * Descripción: Arma el contenido de referencia del tutor dentro del presupuesto de tokens configurado: para profundizar una página (ubicación en lección y módulo, texto de la página y fragmentos de la fuente de conocimiento) y para conversaciones de página, lección o módulo con prioridad página actual, páginas del alcance y resumen del módulo, solo con contenido visible para el lector
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import {
  type IKnowledgeSource,
  type KnowledgeFragment,
  KNOWLEDGE_SOURCE_TOKEN,
  type KnowledgeScope,
} from "@/features/ai-tutor/application/ports/knowledge-source.interface";
import {
  type ITutorContentReader,
  TUTOR_CONTENT_READER_TOKEN,
  type TutorLessonOutline,
  type TutorModuleOutline,
  type TutorPageContent,
} from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { assembleTutorContext, type TutorContextSection, tokensToChars } from "@/features/ai-tutor/domain/services/tutor-context";
import {
  type AiConversationScopeValue,
  LESSON_CONVERSATION_SCOPE,
  MODULE_CONVERSATION_SCOPE,
  PAGE_CONVERSATION_SCOPE,
} from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export interface TutorConversationContext {
  readonly contextTitle?: string;
  readonly context?: string;
}

export interface TutorConversationContextRequest {
  readonly scope: AiConversationScopeValue;
  readonly refId?: string;
  readonly currentPageId?: string;
  readonly question: string;
  readonly canManage: boolean;
}

interface ScopeOutline {
  readonly title: string;
  readonly pageIds: string[];
  readonly module: TutorModuleOutline;
  readonly owns: (page: TutorPageContent) => boolean;
}

@Injectable()
export class TutorContextAssembler {
  public constructor(
    @Inject(TUTOR_CONTENT_READER_TOKEN)
    private readonly _reader: ITutorContentReader,
    @Inject(KNOWLEDGE_SOURCE_TOKEN)
    private readonly _knowledgeSource: IKnowledgeSource,
    private readonly _gateway: AiGateway,
  ) {}

  public async forPageDeepen(page: TutorPageContent, question: string): Promise<string> {
    const fragments: KnowledgeFragment[] = await this._knowledgeSource.retrieve(question, { scope: PAGE_CONVERSATION_SCOPE, refId: page.id });

    return assembleTutorContext([this._locationSection(page), this._pageSection("Contenido de la página", page), ...this._fragmentSections(fragments)], this._budget());
  }

  public async forConversation(request: TutorConversationContextRequest): Promise<TutorConversationContext> {
    if (request.scope === PAGE_CONVERSATION_SCOPE && request.refId) {
      const page: TutorPageContent = await this._reader.getPage(request.refId, request.canManage);
      const fragments: KnowledgeFragment[] = await this._retrieve(request);

      return {
        contextTitle: page.title,
        context: assembleTutorContext([this._pageSection("Página", page), this._locationSection(page), ...this._fragmentSections(fragments)], this._budget()),
      };
    }

    if ((request.scope !== LESSON_CONVERSATION_SCOPE && request.scope !== MODULE_CONVERSATION_SCOPE) || !request.refId) {
      return {};
    }

    const outline: ScopeOutline = await this._loadOutline(request.scope, request.refId, request.canManage);
    const sections: TutorContextSection[] = [];
    const budgetChars: number = tokensToChars(this._budget());
    const current: TutorPageContent | undefined = await this._currentPage(request, outline);
    let usedChars: number = 0;

    if (current) {
      sections.push(this._pageSection(`Página actual: ${current.title}`, current));
      usedChars += current.text.length;
    }

    for (const pageId of outline.pageIds) {
      if (usedChars >= budgetChars) {
        break;
      }

      if (pageId === current?.id) {
        continue;
      }

      const page: TutorPageContent | undefined = await this._reader.getPage(pageId, request.canManage).catch(() => undefined);

      if (page) {
        sections.push(this._pageSection(`Página: ${page.title}`, page));
        usedChars += page.text.length;
      }
    }

    sections.push(this._moduleSummarySection(outline.module));
    sections.push(...this._fragmentSections(await this._retrieve(request)));

    return { contextTitle: outline.title, context: assembleTutorContext(sections, this._budget()) };
  }

  private async _loadOutline(scope: AiConversationScopeValue, refId: string, canManage: boolean): Promise<ScopeOutline> {
    if (scope === LESSON_CONVERSATION_SCOPE) {
      const lesson: TutorLessonOutline = await this._reader.getLessonOutline(refId, canManage);
      const module: TutorModuleOutline = await this._reader.getModuleOutline(lesson.moduleId, canManage);

      return { title: lesson.title, pageIds: lesson.pageIds, module, owns: (page: TutorPageContent) => page.lessonId === lesson.id };
    }

    const module: TutorModuleOutline = await this._reader.getModuleOutline(refId, canManage);

    return { title: module.title, pageIds: module.pageIds, module, owns: (page: TutorPageContent) => page.moduleId === module.id };
  }

  // The current page is only a hint from the client: a page outside the scope or not visible to the reader is ignored.
  private async _currentPage(request: TutorConversationContextRequest, outline: ScopeOutline): Promise<TutorPageContent | undefined> {
    if (!request.currentPageId) {
      return undefined;
    }

    const page: TutorPageContent | undefined = await this._reader.getPage(request.currentPageId, request.canManage).catch(() => undefined);

    return page && outline.owns(page) ? page : undefined;
  }

  private async _retrieve(request: TutorConversationContextRequest): Promise<KnowledgeFragment[]> {
    const scope: KnowledgeScope = { scope: request.scope, refId: request.refId };

    return await this._knowledgeSource.retrieve(request.question, scope);
  }

  private _pageSection(label: string, page: TutorPageContent): TutorContextSection {
    return { label, text: `${page.title}\n${page.text}` };
  }

  private _locationSection(page: TutorPageContent): TutorContextSection {
    const lines: string[] = [`Módulo: ${page.moduleTitle}`];

    if (page.lessonTitle) {
      lines.push(`Lección: ${page.lessonTitle}`);
    }

    lines.push(`Página: ${page.title}`);

    return { label: "Ubicación", text: lines.join("\n") };
  }

  private _moduleSummarySection(module: TutorModuleOutline): TutorContextSection {
    const lines: string[] = [`Módulo: ${module.title}`];

    if (module.description) {
      lines.push(`Descripción: ${module.description}`);
    }

    if (module.lessonTitles.length > 0) {
      lines.push(`Lecciones: ${module.lessonTitles.join("; ")}`);
    }

    return { label: "Resumen del módulo", text: lines.join("\n") };
  }

  private _fragmentSections(fragments: readonly KnowledgeFragment[]): TutorContextSection[] {
    return fragments.map((fragment: KnowledgeFragment) => ({ label: `Fuente: ${fragment.sourceRef}`, text: fragment.text }));
  }

  private _budget(): number {
    return this._gateway.getTutorSettings().contextTokenBudget;
  }
}
