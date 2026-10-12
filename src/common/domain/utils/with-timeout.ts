/*
 * Funcionalidad: Límite de tiempo para promesas
 * Descripción: Rechaza con OperationTimeoutError cuando una promesa no se resuelve dentro del plazo y libera el temporizador al terminar; la operación subyacente no se cancela
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class OperationTimeoutError extends Error {
  public constructor(timeoutMs: number) {
    super(`Operation did not finish within ${timeoutMs} ms`);
    this.name = OperationTimeoutError.name;
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout: Promise<never> = new Promise<never>((_resolve: (value: never) => void, reject: (reason: Error) => void) => {
    timer = setTimeout(() => reject(new OperationTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}
