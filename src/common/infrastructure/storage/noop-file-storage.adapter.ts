/*
 * Funcionalidad: Adaptador NoopFileStorageAdapter
 * Descripción: Implementación de IFileStorageService para cuando Supabase Storage no está configurado: rechaza las escrituras (carga y URL de carga) con FileStorageUnavailableError (503) en lugar de descartarlas, deja lecturas y borrados como operaciones vacías y se reporta como no disponible y no configurado
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { type FileStorageHealthValue, IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { FileStorageUnavailableError } from "@/common/domain/errors/file-storage-unavailable.error";

export class NoopFileStorageAdapter implements IFileStorageService {
  private readonly _logger: Logger = new Logger(NoopFileStorageAdapter.name);

  public constructor() {
    this._logger.warn(
      "NoopFileStorageAdapter is active — uploads are rejected with 503. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET to enable Supabase Storage.",
    );
  }

  public isAvailable(): boolean {
    return false;
  }

  public checkHealth(): Promise<FileStorageHealthValue> {
    return Promise.resolve("not_configured");
  }

  public generateUploadUrl(key: string, _contentType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    this._logger.warn(`[generateUploadUrl] rejected for key: ${key} — file storage is not configured`);

    return Promise.reject(new FileStorageUnavailableError());
  }

  public async generateDownloadUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    this._logger.warn(`[generateDownloadUrl] stub called for key: ${key}`);

    return Promise.resolve(`http://placeholder/download/${key}`);
  }

  public async generateDownloadUrls(keys: string[], _expiresInSeconds?: number): Promise<Map<string, string>> {
    this._logger.warn(`[generateDownloadUrls] stub called for ${keys.length} keys`);

    return Promise.resolve(new Map<string, string>(keys.map((key: string): [string, string] => [key, `http://placeholder/download/${key}`])));
  }

  public uploadFile(key: string, _body: Buffer, _contentType: string): Promise<void> {
    this._logger.warn(`[uploadFile] rejected for key: ${key} — file storage is not configured`);

    return Promise.reject(new FileStorageUnavailableError());
  }

  public async deleteFile(key: string): Promise<void> {
    this._logger.warn(`[deleteFile] stub called for key: ${key} — no file was deleted`);

    return Promise.resolve();
  }
}
