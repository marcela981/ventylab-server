/*
 * Funcionalidad: Dobles de prueba del tutor de IA
 * Descripción: Repositorio de conversaciones en memoria, lector de contenido falso con visibilidad por estado de publicación, fuente de conocimiento falsa, datos personales fijos y un arnés que arma los servicios del tutor sobre un AiGateway real con proveedor LLM falso y registrador en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import { type AiTutorSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  AllowAllAiQuotaGuard,
  type FakeLlmProvider,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";
import { type IKnowledgeSource, type KnowledgeFragment, type KnowledgeScope } from "@/features/ai-tutor/application/ports/knowledge-source.interface";
import {
  type ITutorContentReader,
  type TutorLessonOutline,
  type TutorModuleOutline,
  type TutorPageContent,
} from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { type ITutorPersonalData } from "@/features/ai-tutor/application/ports/tutor-personal-data.interface";
import { type TutorStreamEvent } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { TutorContextAssembler } from "@/features/ai-tutor/application/services/tutor-context-assembler";
import { TutorTurnService } from "@/features/ai-tutor/application/services/tutor-turn.service";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import {
  type AiConversationMessage,
  type NewAiConversationMessage,
} from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { type GetAiConversationsQuery, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";

export class InMemoryAiConversationsRepository implements IAiConversationsRepository {
  public readonly conversations: Map<string, AiConversation> = new Map<string, AiConversation>();
  public readonly messages: AiConversationMessage[] = [];

  public getById(id: string, ownerId: string): Promise<AiConversation | undefined> {
    const conversation: AiConversation | undefined = this.conversations.get(id);

    return Promise.resolve(conversation && conversation.userId === ownerId ? conversation : undefined);
  }

  public getAll(query: GetAiConversationsQuery): Promise<Paginated<AiConversation>> {
    const items: AiConversation[] = [...this.conversations.values()].filter(
      (conversation: AiConversation) => conversation.userId === query.userId && (query.scope === undefined || conversation.scope === query.scope),
    );

    return Promise.resolve(
      new Paginated({ items: items.slice((query.page - 1) * query.limit, query.page * query.limit), total: items.length, page: query.page, limit: query.limit }),
    );
  }

  public save(conversation: AiConversation): Promise<void> {
    this.conversations.set(conversation.id, conversation);

    return Promise.resolve();
  }

  public delete(id: string, ownerId: string): Promise<boolean> {
    const conversation: AiConversation | undefined = this.conversations.get(id);

    if (!conversation || conversation.userId !== ownerId) {
      return Promise.resolve(false);
    }

    this.conversations.delete(id);

    return Promise.resolve(true);
  }

  public getMessages(conversationId: string): Promise<AiConversationMessage[]> {
    return Promise.resolve(this.messages.filter((message: AiConversationMessage) => message.conversationId === conversationId));
  }

  public async getRecentMessages(conversationId: string, limit: number): Promise<AiConversationMessage[]> {
    const messages: AiConversationMessage[] = await this.getMessages(conversationId);

    return messages.slice(-limit);
  }

  public addMessage(message: NewAiConversationMessage): Promise<void> {
    this.messages.push({ ...message, createdAt: new Date() });

    return Promise.resolve();
  }

  public messagesOf(conversationId: string): AiConversationMessage[] {
    return this.messages.filter((message: AiConversationMessage) => message.conversationId === conversationId);
  }
}

export interface FakePage extends TutorPageContent {
  readonly published: boolean;
}

export class FakeTutorContentReader implements ITutorContentReader {
  public pages: FakePage[] = [];
  public lessons: (TutorLessonOutline & { published: boolean })[] = [];
  public modules: (TutorModuleOutline & { published: boolean })[] = [];
  public readonly pageReads: string[] = [];

  public getPage(pageId: string, canManage: boolean): Promise<TutorPageContent> {
    this.pageReads.push(pageId);

    const page: FakePage | undefined = this.pages.find((candidate: FakePage) => candidate.id === pageId);

    if (!page || (!canManage && !page.published)) {
      return Promise.reject(new PageNotFoundError());
    }

    return Promise.resolve(page);
  }

  public getLessonOutline(lessonId: string, canManage: boolean): Promise<TutorLessonOutline> {
    const lesson: (TutorLessonOutline & { published: boolean }) | undefined = this.lessons.find((candidate: TutorLessonOutline) => candidate.id === lessonId);

    if (!lesson || (!canManage && !lesson.published)) {
      return Promise.reject(new LessonNotFoundError());
    }

    return Promise.resolve({ ...lesson, pageIds: lesson.pageIds.filter((id: string) => canManage || this._isPublished(id)) });
  }

  public getModuleOutline(moduleId: string, canManage: boolean): Promise<TutorModuleOutline> {
    const module: (TutorModuleOutline & { published: boolean }) | undefined = this.modules.find((candidate: TutorModuleOutline) => candidate.id === moduleId);

    if (!module || (!canManage && !module.published)) {
      return Promise.reject(new ModuleNotFoundError());
    }

    return Promise.resolve({ ...module, pageIds: module.pageIds.filter((id: string) => canManage || this._isPublished(id)) });
  }

  private _isPublished(pageId: string): boolean {
    return this.pages.some((page: FakePage) => page.id === pageId && page.published);
  }
}

export class FakeKnowledgeSource implements IKnowledgeSource {
  public readonly queries: { query: string; scope: KnowledgeScope }[] = [];

  public constructor(private readonly _fragments: KnowledgeFragment[] = []) {}

  public retrieve(query: string, scope: KnowledgeScope): Promise<KnowledgeFragment[]> {
    this.queries.push({ query, scope });

    return Promise.resolve(this._fragments);
  }
}

export class StaticTutorPersonalData implements ITutorPersonalData {
  public constructor(private readonly _names: string[] = []) {}

  public getRedactableNames(_userId: string): Promise<string[]> {
    return Promise.resolve(this._names);
  }
}

export interface TutorHarness {
  readonly gateway: AiGateway;
  readonly recorder: InMemoryAiCallRecorder;
  readonly repository: InMemoryAiConversationsRepository;
  readonly reader: FakeTutorContentReader;
  readonly knowledge: FakeKnowledgeSource;
  readonly assembler: TutorContextAssembler;
  readonly turns: TutorTurnService;
}

export function buildTutorHarness(
  provider: FakeLlmProvider,
  { fragments = [], names = [], contextTokenBudget = 4000 }: { fragments?: KnowledgeFragment[]; names?: string[]; contextTokenBudget?: number } = {},
): TutorHarness {
  const settings: StaticAiSettingsProvider = new StaticAiSettingsProvider({
    providerChain: [provider.id],
    models: { [provider.id]: "fake-model" },
    timeoutMs: 1000,
    maxOutputTokens: 256,
    temperature: 0.2,
  });

  settings.getTutorSettings = (): AiTutorSettings => ({ historyWindow: 4, contextTokenBudget });

  const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
  const gateway: AiGateway = new AiGateway(new AiOrchestrator(providerRegistry(provider), settings, recorder), new AllowAllAiQuotaGuard());
  const repository: InMemoryAiConversationsRepository = new InMemoryAiConversationsRepository();
  const reader: FakeTutorContentReader = new FakeTutorContentReader();
  const knowledge: FakeKnowledgeSource = new FakeKnowledgeSource(fragments);
  const assembler: TutorContextAssembler = new TutorContextAssembler(reader, knowledge, gateway);
  const turns: TutorTurnService = new TutorTurnService(gateway, repository, new StaticTutorPersonalData(names), assembler);

  return { gateway, recorder, repository, reader, knowledge, assembler, turns };
}

export const STUDENT_CALLER: TutorCaller = {
  userId: "student-1",
  userRole: "STUDENT",
  email: "ana.perez@correounivalle.edu.co",
  canManage: false,
  language: "es",
};

export const TEACHER_CALLER: TutorCaller = { ...STUDENT_CALLER, userId: "teacher-1", userRole: "TEACHER", email: "docente@correounivalle.edu.co", canManage: true };

export async function collectEvents(events: AsyncIterable<TutorStreamEvent>): Promise<TutorStreamEvent[]> {
  const collected: TutorStreamEvent[] = [];

  for await (const event of events) {
    collected.push(event);
  }

  return collected;
}
