/*
 * Funcionalidad: Módulo MediaModule
 * Descripción: Registra el controlador, los casos de uso, el repositorio Prisma y la configuración de media, configura Multer en memoria con el límite de tamaño máximo e importa el módulo global del resolvedor de URLs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";

import { AuthModule } from "@/features/auth/auth.module";
import { DeleteMediaUseCase } from "@/features/media/application/use-cases/delete-media.usecase";
import { GetMediaByIdUseCase } from "@/features/media/application/use-cases/get-media-by-id.usecase";
import { GetMediaListUseCase } from "@/features/media/application/use-cases/get-media-list.usecase";
import { GetMediaURLUseCase } from "@/features/media/application/use-cases/get-media-url.usecase";
import { UploadMediaUseCase } from "@/features/media/application/use-cases/upload-media.usecase";
import { MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { createMediaMulterOptions, MEDIA_SETTINGS_PROVIDER } from "@/features/media/infrastructure/config/media-settings.provider";
import { MediaPrismaRepository } from "@/features/media/infrastructure/persistence/prisma/repositories/media-prisma.repository";
import { MediaURLResolverModule } from "@/features/media/media-url-resolver.module";
import { MediaController } from "@/features/media/presentation/controllers/media.controller";

@Module({
  imports: [
    AuthModule,
    MediaURLResolverModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: createMediaMulterOptions,
    }),
  ],
  controllers: [MediaController],
  providers: [
    MEDIA_SETTINGS_PROVIDER,
    {
      provide: MEDIA_REPOSITORY_TOKEN,
      useClass: MediaPrismaRepository,
    },
    UploadMediaUseCase,
    GetMediaListUseCase,
    GetMediaByIdUseCase,
    GetMediaURLUseCase,
    DeleteMediaUseCase,
  ],
})
export class MediaModule {}
