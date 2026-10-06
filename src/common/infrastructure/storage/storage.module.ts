/*
 * Funcionalidad: Módulo StorageModule
 * Descripción: Módulo global que enlaza IFileStorageService con SupabaseFileStorageAdapter cuando SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET están definidas, y con NoopFileStorageAdapter en caso contrario
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { NoopFileStorageAdapter } from "@/common/infrastructure/storage/noop-file-storage.adapter";
import { SupabaseFileStorageAdapter } from "@/common/infrastructure/storage/supabase-file-storage.adapter";

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE_SERVICE_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>): IFileStorageService => {
        const url: string = configService.get("SUPABASE_URL") ?? "";
        const serviceRoleKey: string = configService.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const bucket: string = configService.get("SUPABASE_STORAGE_BUCKET") ?? "";

        if (url && serviceRoleKey && bucket) {
          return new SupabaseFileStorageAdapter({ url, serviceRoleKey, bucket });
        }

        return new NoopFileStorageAdapter();
      },
    },
  ],
  exports: [FILE_STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
