/*
 * Funcionalidad: Adaptador de almacenamiento en disco local
 * Descripción: Implementa IFileStorageService sobre una carpeta del sistema de archivos para desarrollo y pruebas sin Supabase (StorageModule solo lo activa fuera de producción): guarda cada objeto con su tipo MIME en un archivo vecino, lo entrega como URL data: en base64 (sin ruta HTTP adicional), borra sin error si ya no existe, rechaza claves que salgan de la carpeta y no ofrece URLs de subida firmadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import { Logger } from "@nestjs/common";

import { type FileStorageHealthValue, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { FileStorageUnavailableError } from "@/common/domain/errors/file-storage-unavailable.error";

const CONTENT_TYPE_SUFFIX: string = ".content-type";

const DEFAULT_CONTENT_TYPE: string = "application/octet-stream";

export class LocalDiskFileStorageAdapter implements IFileStorageService {
  private readonly _logger: Logger = new Logger(LocalDiskFileStorageAdapter.name);
  private readonly _root: string;

  public constructor(root: string) {
    this._root = resolve(root);
    this._logger.warn(`LocalDiskFileStorageAdapter is active (development only): files are stored under ${this._root}`);
  }

  public isAvailable(): boolean {
    return true;
  }

  public checkHealth(): Promise<FileStorageHealthValue> {
    return Promise.resolve("up");
  }

  public generateUploadUrl(_key: string, _contentType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    return Promise.reject(new FileStorageUnavailableError());
  }

  public async generateDownloadUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    return (await this._readDataUrl(key)) ?? "";
  }

  public async generateDownloadUrls(keys: string[], _expiresInSeconds?: number): Promise<Map<string, string>> {
    const urls: Map<string, string> = new Map<string, string>();

    for (const key of keys) {
      const url: string | undefined = await this._readDataUrl(key);

      if (url !== undefined) {
        urls.set(key, url);
      }
    }

    return urls;
  }

  public async uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
    const path: string = this._pathOf(key);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    await writeFile(`${path}${CONTENT_TYPE_SUFFIX}`, contentType, "utf-8");
  }

  public async deleteFile(key: string): Promise<void> {
    const path: string = this._pathOf(key);

    await rm(path, { force: true });
    await rm(`${path}${CONTENT_TYPE_SUFFIX}`, { force: true });
  }

  private async _readDataUrl(key: string): Promise<string | undefined> {
    const path: string = this._pathOf(key);

    try {
      const [body, contentType]: [Buffer, string] = await Promise.all([
        readFile(path),
        readFile(`${path}${CONTENT_TYPE_SUFFIX}`, "utf-8").catch((): string => DEFAULT_CONTENT_TYPE),
      ]);

      return `data:${contentType};base64,${body.toString("base64")}`;
    } catch {
      return undefined;
    }
  }

  private _pathOf(key: string): string {
    const path: string = resolve(this._root, key);

    if (!path.startsWith(`${this._root}${sep}`)) {
      throw new FileStorageUnavailableError();
    }

    return path;
  }
}
