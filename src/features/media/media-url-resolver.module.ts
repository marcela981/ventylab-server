/*
 * Funcionalidad: Módulo MediaURLResolverModule
 * Descripción: Módulo global que provee IMediaUrlResolver (MEDIA_URL_RESOLVER_TOKEN) para que las features curriculares lo inyecten con @Optional() sin importar MediaModule; solo depende de módulos globales (Prisma, almacenamiento, configuración)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { MEDIA_URL_RESOLVER_TOKEN } from "@/common/application/ports/media-url-resolver.interface";
import { MediaURLResolverService } from "@/features/media/application/services/media-url-resolver.service";
import { MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { MEDIA_SETTINGS_PROVIDER } from "@/features/media/infrastructure/config/media-settings.provider";
import { MediaPrismaRepository } from "@/features/media/infrastructure/persistence/prisma/repositories/media-prisma.repository";

@Global()
@Module({
  providers: [
    MEDIA_SETTINGS_PROVIDER,
    {
      provide: MEDIA_REPOSITORY_TOKEN,
      useClass: MediaPrismaRepository,
    },
    {
      provide: MEDIA_URL_RESOLVER_TOKEN,
      useClass: MediaURLResolverService,
    },
  ],
  exports: [MEDIA_URL_RESOLVER_TOKEN],
})
export class MediaURLResolverModule {}
