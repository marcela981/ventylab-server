/*
 * Funcionalidad: Proyección del nombre del operador del ventilador
 * Descripción: Decide sin efectos secundarios si quien mira ve el nombre del operador (docentes y administradores siempre; un estudiante solo si el operador es él mismo o es titular de la reserva activa, como él) o una etiqueta genérica traducible (docente o estudiante), con la misma regla de visibilidad que las reservas
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { isPrivilegedVentilatorRole } from "@/features/ventilator-commands/domain/services/operator-control-policy";

export const OPERATOR_TEACHER_LABEL_KEY: string = "ventilator-commands.operator_labels.teacher";
export const OPERATOR_STUDENT_LABEL_KEY: string = "ventilator-commands.operator_labels.student";

export interface OperatorIdentity {
  readonly userId: string;
  /** Name, or email when the user has no name */
  readonly displayName: string;
  readonly role: string;
  /** Holder of the reservation the control belongs to (holder user or member of the holder group) */
  readonly isHolder: boolean;
}

export interface OperatorNameViewer {
  readonly userId?: string;
  readonly role: string;
  /** Holder of the same active reservation */
  readonly isHolder: boolean;
}

export interface OperatorNameProjection {
  readonly operatorName: string | null;
  /** i18n key of the generic label shown instead of a hidden name */
  readonly operatorLabelKey: string | null;
}

const NO_OPERATOR: OperatorNameProjection = { operatorName: null, operatorLabelKey: null };

export function projectOperatorName(operator: OperatorIdentity | undefined, viewer: OperatorNameViewer): OperatorNameProjection {
  if (!operator) {
    return NO_OPERATOR;
  }

  const visible: boolean = isPrivilegedVentilatorRole(viewer.role) || operator.userId === viewer.userId || (operator.isHolder && viewer.isHolder);

  if (visible) {
    return { operatorName: operator.displayName, operatorLabelKey: null };
  }

  return { operatorName: null, operatorLabelKey: isPrivilegedVentilatorRole(operator.role) ? OPERATOR_TEACHER_LABEL_KEY : OPERATOR_STUDENT_LABEL_KEY };
}
