/*
 * Funcionalidad: Proveedor de configuración de media
 * Descripción: Construye MediaSettings a partir de ConfigService (MEDIA_MAX_IMAGE_BYTES, MEDIA_MAX_VIDEO_BYTES, MEDIA_MAX_FILE_BYTES, MEDIA_SIGNED_URL_TTL_SECONDS) y la opción de Multer con el límite de tamaño máximo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type MulterModuleOptions } from "@nestjs/platform-express";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { MEDIA_SETTINGS_TOKEN, type MediaSettings } from "@/features/media/application/tokens/media-settings.token";
import { MediaUploadPolicy } from "@/features/media/domain/value-objects/media-upload-policy";

export function readMediaSettings(configService: ConfigService<EnvironmentVariables, true>): MediaSettings {
  return {
    sizeLimits: {
      IMAGE: configService.get("MEDIA_MAX_IMAGE_BYTES", { infer: true }),
      VIDEO: configService.get("MEDIA_MAX_VIDEO_BYTES", { infer: true }),
      FILE: configService.get("MEDIA_MAX_FILE_BYTES", { infer: true }),
    },
    signedUrlTtlSeconds: configService.get("MEDIA_SIGNED_URL_TTL_SECONDS", { infer: true }),
  };
}

export function createMediaMulterOptions(configService: ConfigService<EnvironmentVariables, true>): MulterModuleOptions {
  return {
    limits: { fileSize: MediaUploadPolicy.create(readMediaSettings(configService).sizeLimits).maxSizeBytes, files: 1 },
  };
}

export const MEDIA_SETTINGS_PROVIDER: FactoryProvider<MediaSettings> = {
  provide: MEDIA_SETTINGS_TOKEN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentVariables, true>): MediaSettings => readMediaSettings(configService),
};
