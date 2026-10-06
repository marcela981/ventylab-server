/*
 * Funcionalidad: Política de intentos de evaluación
 * Descripción: Reglas puras de los intentos de estudiante: clave del candado transaccional por evaluación y usuario, plazo calculado en el servidor (min(inicio + duración, fin de la asignación)), plazo efectivo tras un cierre anticipado de la asignación, expiración con 30 s de gracia y barajado determinista de preguntas sembrado por el ID del intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const ATTEMPT_SUBMIT_GRACE_MS: number = 30_000;

const MINUTE_MS: number = 60_000;

export function evaluationAttemptLockKey(evaluationId: string, userId: string): string {
  return `evaluations:attempt:${evaluationId}:${userId}`;
}

function earliest(left?: Date, right?: Date): Date | undefined {
  if (left === undefined) {
    return right;
  }

  if (right === undefined) {
    return left;
  }

  return left.getTime() <= right.getTime() ? left : right;
}

export function computeAttemptDeadline({ startedAt, durationMinutes, endsAt }: { startedAt: Date; durationMinutes?: number; endsAt?: Date }): Date | undefined {
  const byDuration: Date | undefined = durationMinutes === undefined ? undefined : new Date(startedAt.getTime() + durationMinutes * MINUTE_MS);

  return earliest(byDuration, endsAt);
}

export function effectiveAttemptDeadline(deadlineAt?: Date, assignmentEndsAt?: Date): Date | undefined {
  return earliest(deadlineAt, assignmentEndsAt);
}

export function isAttemptExpired(deadlineAt: Date | undefined, now: Date): boolean {
  return deadlineAt !== undefined && now.getTime() > deadlineAt.getTime() + ATTEMPT_SUBMIT_GRACE_MS;
}

function seedFrom(text: string): number {
  let hash: number = 2166136261;

  for (let index: number = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state: number = seed;

  return (): number => {
    state = (state + 0x6d2b79f5) | 0;

    let mixed: number = Math.imul(state ^ (state >>> 15), 1 | state);

    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleForAttempt<T>(items: ReadonlyArray<T>, seed: string): T[] {
  const random: () => number = seededRandom(seedFrom(seed));
  const shuffled: T[] = [...items];

  for (let index: number = shuffled.length - 1; index > 0; index--) {
    const swap: number = Math.floor(random() * (index + 1));

    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }

  return shuffled;
}
