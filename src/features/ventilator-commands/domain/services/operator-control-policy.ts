/*
 * Funcionalidad: Política del control exclusivo del ventilador
 * Descripción: Decide sin efectos secundarios si quien lo pide toma el control libre, ya es el operador, lo arrebata (solo el líder del grupo titular, un docente o un administrador) o queda bloqueado, y quién puede liberar el control
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ControlRequestKind = "take" | "takeover";

export type ControlDecision = "not_holder" | "already_operator" | "take" | "takeover" | "locked";

export interface ControlRequestFacts {
  readonly actorUserId: string;
  readonly actorRole: string;
  readonly isHolder: boolean;
  readonly leadsHolderGroup: boolean;
  readonly currentOperatorUserId: string | undefined;
}

export const VENTILATOR_PRIVILEGED_ROLES: readonly string[] = ["TEACHER", "ADMIN"] as const;

export function isPrivilegedVentilatorRole(role: string): boolean {
  return VENTILATOR_PRIVILEGED_ROLES.includes(role);
}

export function decideControlRequest(kind: ControlRequestKind, facts: ControlRequestFacts): ControlDecision {
  const privileged: boolean = isPrivilegedVentilatorRole(facts.actorRole);

  if (!facts.isHolder && !privileged) {
    return "not_holder";
  }

  if (facts.currentOperatorUserId === undefined) {
    return "take";
  }

  if (facts.currentOperatorUserId === facts.actorUserId) {
    return "already_operator";
  }

  if (kind === "takeover" && (privileged || facts.leadsHolderGroup)) {
    return "takeover";
  }

  return "locked";
}

export function canReleaseControl(actorUserId: string, actorRole: string, operatorUserId: string): boolean {
  return actorUserId === operatorUserId || isPrivilegedVentilatorRole(actorRole);
}
