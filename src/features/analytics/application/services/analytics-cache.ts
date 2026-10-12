/*
 * Funcionalidad: Caché AnalyticsCache
 * Descripción: Caché en memoria de los paneles de analítica con TTL de 60 s por clave (la clave incluye el panel, su recurso y el alcance del solicitante): comparte la carga en curso entre peticiones simultáneas, olvida una carga fallida y acota el número de entradas descartando las vencidas y luego las más antiguas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

export const ANALYTICS_CACHE_TTL_MS: number = 60_000;

export const ANALYTICS_CACHE_MAX_ENTRIES: number = 500;

interface CacheEntry {
  readonly expiresAt: number;
  readonly value: Promise<unknown>;
}

@Injectable()
export class AnalyticsCache {
  private readonly _entries: Map<string, CacheEntry> = new Map<string, CacheEntry>();

  public get size(): number {
    return this._entries.size;
  }

  public async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const now: number = Date.now();
    const cached: CacheEntry | undefined = this._entries.get(key);

    if (cached !== undefined && cached.expiresAt > now) {
      return (await cached.value) as T;
    }

    const value: Promise<T> = loader();

    this._entries.delete(key);
    this._entries.set(key, { expiresAt: now + ANALYTICS_CACHE_TTL_MS, value });
    this._evict(now);

    try {
      return await value;
    } catch (error: unknown) {
      if (this._entries.get(key)?.value === value) {
        this._entries.delete(key);
      }

      throw error;
    }
  }

  private _evict(now: number): void {
    for (const [key, entry] of this._entries) {
      if (entry.expiresAt <= now) {
        this._entries.delete(key);
      }
    }

    for (const key of this._entries.keys()) {
      if (this._entries.size <= ANALYTICS_CACHE_MAX_ENTRIES) {
        break;
      }

      this._entries.delete(key);
    }
  }
}
