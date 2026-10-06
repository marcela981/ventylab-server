/*
 * Funcionalidad: Adaptador NoopFileStorageAdapter
 * Descripción: Implementación vacía de IFileStorageService que solo registra las operaciones y se reporta como no disponible cuando Supabase Storage no está configurado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { generateId } from "@/common/domain/utils/generate-id";

export class NoopFileStorageAdapter implements IFileStorageService {
  private readonly _logger: Logger = new Logger(NoopFileStorageAdapter.name);

  public constructor() {
    this._logger.warn(
      "NoopFileStorageAdapter is active — file operations are stubs. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET to enable Supabase Storage.",
    );
  }

  public isAvailable(): boolean {
    return false;
  }

  public async generateUploadUrl(key: string, _contentType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileKey: string = `noop/${key}-${generateId()}`;

    this._logger.warn(`[generateUploadUrl] stub called for key: ${key}`);

    return Promise.resolve({
      uploadUrl: `http://placeholder/upload/${fileKey}`,
      fileKey,
    });
  }

  public async generateDownloadUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    this._logger.warn(`[generateDownloadUrl] stub called for key: ${key}`);

    return Promise.resolve(`http://placeholder/download/${key}`);
  }

  public async generateDownloadUrls(keys: string[], _expiresInSeconds?: number): Promise<Map<string, string>> {
    this._logger.warn(`[generateDownloadUrls] stub called for ${keys.length} keys`);

    return Promise.resolve(new Map<string, string>(keys.map((key: string): [string, string] => [key, `http://placeholder/download/${key}`])));
  }

  public async uploadFile(key: string, _body: Buffer, _contentType: string): Promise<void> {
    this._logger.warn(`[uploadFile] stub called for key: ${key} — no file was stored`);

    return Promise.resolve();
  }

  public async deleteFile(key: string): Promise<void> {
    this._logger.warn(`[deleteFile] stub called for key: ${key} — no file was deleted`);

    return Promise.resolve();
  }
}
