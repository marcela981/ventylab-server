/*
 * Funcionalidad: Reglas de desbloqueo del currículo
 * Descripción: Calcula si un nivel o módulo está bloqueado para un estudiante a partir de sus prerrequisitos (lógica AND) y del conjunto de nodos completados, sin bloquear nunca un nodo ya completado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface NamedReference {
  readonly id: string;
  readonly title: string;
}

export interface UnlockState {
  readonly locked: boolean;
  readonly missingPrerequisites: NamedReference[];
}

export const UNLOCKED_STATE: UnlockState = { locked: false, missingPrerequisites: [] };

export function computeUnlockState(prerequisites: ReadonlyArray<NamedReference>, completedIds: ReadonlySet<string>, isCompleted: boolean): UnlockState {
  if (isCompleted) {
    return UNLOCKED_STATE;
  }

  const missingPrerequisites: NamedReference[] = prerequisites.filter((prerequisite: NamedReference) => !completedIds.has(prerequisite.id));

  return { locked: missingPrerequisites.length > 0, missingPrerequisites };
}

export function isGroupCompleted(memberIds: ReadonlyArray<string>, completedIds: ReadonlySet<string>): boolean {
  return memberIds.length > 0 && memberIds.every((memberId: string) => completedIds.has(memberId));
}

export function combineUnlockStates(parent: UnlockState, child: UnlockState): UnlockState {
  if (!parent.locked) {
    return child;
  }

  return { locked: true, missingPrerequisites: [...parent.missingPrerequisites, ...child.missingPrerequisites] };
}
