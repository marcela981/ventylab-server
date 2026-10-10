/*
 * Funcionalidad: Limitador de frecuencia de comandos
 * Descripción: Un cubo de fichas en memoria por usuario con VENTILATOR_COMMAND_RATE_PER_SECOND fichas por segundo; devuelve los milisegundos de espera cuando el usuario agotó su ráfaga y descarta los cubos llenos cuando crecen demasiado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { VENTILATOR_COMMANDS_SETTINGS_TOKEN, type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { TokenBucket } from "@/features/ventilator-commands/domain/services/token-bucket";

const MAX_TRACKED_USERS: number = 1000;

@Injectable()
export class CommandRateLimiterService {
  private readonly _buckets: Map<string, TokenBucket> = new Map<string, TokenBucket>();

  public constructor(
    @Inject(VENTILATOR_COMMANDS_SETTINGS_TOKEN)
    private readonly _settings: VentilatorCommandsSettings,
  ) {}

  public tryConsume(userId: string, nowMs: number = Date.now()): number {
    let bucket: TokenBucket | undefined = this._buckets.get(userId);

    if (!bucket) {
      this._pruneFullBuckets(nowMs);
      bucket = new TokenBucket(this._settings.ratePerSecond, nowMs);
      this._buckets.set(userId, bucket);
    }

    return bucket.tryConsume(nowMs);
  }

  private _pruneFullBuckets(nowMs: number): void {
    if (this._buckets.size < MAX_TRACKED_USERS) {
      return;
    }

    for (const [userId, bucket] of this._buckets) {
      if (bucket.isFull(nowMs)) {
        this._buckets.delete(userId);
      }
    }
  }
}
