/*
 * Funcionalidad: Adaptador SupabaseFileStorageAdapter
 * Descripción: Implementación de IFileStorageService sobre un bucket privado de Supabase Storage (carga desde el servidor, URLs firmadas de carga y descarga, firma en lote, borrado y chequeo de salud listando a lo sumo un objeto del bucket) usando @supabase/supabase-js con la service role key
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { type FileStorageHealthValue, IFileStorageService } from "@/common/application/ports/file-storage.interface";

export const DEFAULT_SIGNED_URL_TTL_SECONDS: number = 3600;

export interface SupabaseStorageSettings {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

type StorageBucketAPI = ReturnType<SupabaseClient["storage"]["from"]>;

export class SupabaseFileStorageAdapter implements IFileStorageService {
  private readonly _client: SupabaseClient;
  private readonly _bucket: string;

  public constructor(settings: SupabaseStorageSettings) {
    this._client = createClient(settings.url, settings.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this._bucket = settings.bucket;
  }

  public isAvailable(): boolean {
    return true;
  }

  public async generateUploadUrl(key: string, _contentType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const { data, error } = await this._storage().createSignedUploadUrl(key);

    if (error) {
      throw new Error(`Supabase Storage could not sign an upload URL for ${key}: ${error.message}`);
    }

    return { uploadUrl: data.signedUrl, fileKey: data.path };
  }

  public async generateDownloadUrl(key: string, expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS): Promise<string> {
    const { data, error } = await this._storage().createSignedUrl(key, expiresInSeconds);

    if (error) {
      throw new Error(`Supabase Storage could not sign a download URL for ${key}: ${error.message}`);
    }

    return data.signedUrl;
  }

  public async generateDownloadUrls(keys: string[], expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS): Promise<Map<string, string>> {
    const urls: Map<string, string> = new Map<string, string>();

    if (keys.length === 0) {
      return urls;
    }

    const { data, error } = await this._storage().createSignedUrls(keys, expiresInSeconds);

    if (error) {
      throw new Error(`Supabase Storage could not sign ${keys.length} download URLs: ${error.message}`);
    }

    for (const entry of data) {
      if (entry.path && entry.signedUrl && !entry.error) {
        urls.set(entry.path, entry.signedUrl);
      }
    }

    return urls;
  }

  public async uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
    const { error } = await this._storage().upload(key, body, { contentType, upsert: false });

    if (error) {
      throw new Error(`Supabase Storage could not upload ${key}: ${error.message}`);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    const { error } = await this._storage().remove([key]);

    if (error) {
      throw new Error(`Supabase Storage could not delete ${key}: ${error.message}`);
    }
  }

  public async checkHealth(): Promise<FileStorageHealthValue> {
    try {
      const { error } = await this._storage().list("", { limit: 1 });

      return error ? "down" : "up";
    } catch {
      return "down";
    }
  }

  private _storage(): StorageBucketAPI {
    return this._client.storage.from(this._bucket);
  }
}
