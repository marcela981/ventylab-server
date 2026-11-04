/*
 * Funcionalidad: Módulo de almacenamiento de archivos
 * Descripción: Módulo global que enlaza FILE_STORAGE_SERVICE_TOKEN a Supabase Storage cuando SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET están definidas; sin ellas, fuera de producción usa una carpeta en el directorio temporal del sistema (LocalDiskFileStorageAdapter, para desarrollo y E2E) y en producción el adaptador que rechaza las escrituras con 503
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { LocalDiskFileStorageAdapter } from "@/common/infrastructure/storage/local-disk-file-storage.adapter";
import { NoopFileStorageAdapter } from "@/common/infrastructure/storage/noop-file-storage.adapter";
import { SupabaseFileStorageAdapter } from "@/common/infrastructure/storage/supabase-file-storage.adapter";

const LOCAL_STORAGE_FOLDER: string = "ventylab-local-storage";

export function createFileStorage(configService: ConfigService<EnvironmentVariables>): IFileStorageService {
  const url: string = configService.get("SUPABASE_URL") ?? "";
  const serviceRoleKey: string = configService.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bucket: string = configService.get("SUPABASE_STORAGE_BUCKET") ?? "";

  if (url && serviceRoleKey && bucket) {
    return new SupabaseFileStorageAdapter({ url, serviceRoleKey, bucket });
  }

  if (configService.get("NODE_ENV") !== Environment.Production) {
    return new LocalDiskFileStorageAdapter(join(tmpdir(), LOCAL_STORAGE_FOLDER));
  }

  return new NoopFileStorageAdapter();
}

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE_SERVICE_TOKEN,
      inject: [ConfigService],
      useFactory: createFileStorage,
    },
  ],
  exports: [FILE_STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
