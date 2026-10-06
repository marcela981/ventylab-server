/*
 * Funcionalidad: Módulo AiTutorModule
 * Descripción: Registra el tutor de IA: controlador SSE y de conversaciones, casos de uso, servicios de turnos y de contexto, repositorio Prisma de conversaciones, lector de contenido sobre pages/lessons/modules, fuente de conocimiento vacía por defecto y datos personales desde users; usa AiGateway de AiModule
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AiModule } from "@/features/ai/ai.module";
import { KNOWLEDGE_SOURCE_TOKEN } from "@/features/ai-tutor/application/ports/knowledge-source.interface";
import { TUTOR_CONTENT_READER_TOKEN } from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { TUTOR_PERSONAL_DATA_TOKEN } from "@/features/ai-tutor/application/ports/tutor-personal-data.interface";
import { TutorContextAssembler } from "@/features/ai-tutor/application/services/tutor-context-assembler";
import { TutorTurnService } from "@/features/ai-tutor/application/services/tutor-turn.service";
import { DeepenPageUseCase } from "@/features/ai-tutor/application/use-cases/deepen-page.usecase";
import { DeleteAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/delete-ai-conversation.usecase";
import { GetAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversation.usecase";
import { GetAiConversationsUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversations.usecase";
import { RenameAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/rename-ai-conversation.usecase";
import { SendAiConversationMessageUseCase } from "@/features/ai-tutor/application/use-cases/send-ai-conversation-message.usecase";
import { StartAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/start-ai-conversation.usecase";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";
import { CurriculumTutorContentReader } from "@/features/ai-tutor/infrastructure/content/curriculum-tutor-content-reader";
import { EmptyKnowledgeSource } from "@/features/ai-tutor/infrastructure/knowledge/empty-knowledge-source";
import { AiConversationsPrismaRepository } from "@/features/ai-tutor/infrastructure/persistence/prisma/repositories/ai-conversations-prisma.repository";
import { UsersTutorPersonalData } from "@/features/ai-tutor/infrastructure/users/users-tutor-personal-data";
import { AiTutorController } from "@/features/ai-tutor/presentation/controllers/ai-tutor.controller";
import { LessonsModule } from "@/features/lessons/lessons.module";
import { ModulesModule } from "@/features/modules/modules.module";
import { PagesModule } from "@/features/pages/pages.module";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AiModule, PagesModule, LessonsModule, ModulesModule, UsersModule],
  controllers: [AiTutorController],
  providers: [
    { provide: AI_CONVERSATIONS_REPOSITORY_TOKEN, useClass: AiConversationsPrismaRepository },
    { provide: TUTOR_CONTENT_READER_TOKEN, useClass: CurriculumTutorContentReader },
    { provide: KNOWLEDGE_SOURCE_TOKEN, useClass: EmptyKnowledgeSource },
    { provide: TUTOR_PERSONAL_DATA_TOKEN, useClass: UsersTutorPersonalData },
    TutorContextAssembler,
    TutorTurnService,
    DeepenPageUseCase,
    StartAiConversationUseCase,
    SendAiConversationMessageUseCase,
    GetAiConversationsUseCase,
    GetAiConversationUseCase,
    RenameAiConversationUseCase,
    DeleteAiConversationUseCase,
  ],
})
export class AiTutorModule {}
