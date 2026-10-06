/*
 * Funcionalidad: Puerto IFileStorageService
 * Descripción: Define el contrato y el token de inyección del servicio de almacenamiento de archivos, incluida la carga desde el servidor y la firma de URLs de descarga en lote
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const FILE_STORAGE_SERVICE_TOKEN: unique symbol = Symbol("FILE_STORAGE_SERVICE_TOKEN");

export interface IFileStorageService {
  isAvailable(): boolean;
  generateUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; fileKey: string }>;
  generateDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  generateDownloadUrls(keys: string[], expiresInSeconds?: number): Promise<Map<string, string>>;
  uploadFile(key: string, body: Buffer, contentType: string): Promise<void>;
  deleteFile(key: string): Promise<void>;
}
