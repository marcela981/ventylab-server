/*
 * Funcionalidad: Espera por condición en pruebas
 * Descripción: Reintenta una lectura asíncrona hasta que cumple una condición o vence un tiempo límite, para observar efectos de manejadores asíncronos (notificaciones, retroalimentación, telemetría de IA, reconexión MQTT) sin esperas fijas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface WaitOptions {
  readonly timeoutMs?: number;
  readonly intervalMs?: number;
  readonly description?: string;
}

const DEFAULT_TIMEOUT_MS: number = 15_000;
const DEFAULT_INTERVAL_MS: number = 200;

export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, ms);
  });
}

export async function waitUntil<T>(read: () => Promise<T>, accept: (value: T) => boolean, options: WaitOptions = {}): Promise<T> {
  const deadline: number = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let last: T = await read();

  while (!accept(last)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${options.description ?? "a condition"}; last value: ${JSON.stringify(last)}`);
    }

    await delay(options.intervalMs ?? DEFAULT_INTERVAL_MS);
    last = await read();
  }

  return last;
}
