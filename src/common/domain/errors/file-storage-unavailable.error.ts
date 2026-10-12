/*
 * Funcionalidad: Error FileStorageUnavailableError
 * Descripción: Error de dominio lanzado cuando se intenta escribir un archivo sin un almacenamiento configurado; se responde con 503
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class FileStorageUnavailableError extends DomainError {
  public constructor() {
    super("File storage is not configured", "common.storage_unavailable");
  }
}
