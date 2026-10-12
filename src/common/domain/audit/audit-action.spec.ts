/*
 * Funcionalidad: Pruebas del catálogo de acciones de auditoría
 * Descripción: Verifica que las acciones ya persistidas conserven su cadena exacta y que el catálogo no repita valores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AUDIT_ACTION_VALUES, AUDIT_ACTIONS } from "@/common/domain/audit/audit-action";

describe("AUDIT_ACTIONS", () => {
  it("keeps the persisted strings of actions already stored in audit_logs", () => {
    expect(AUDIT_ACTIONS.USER_ROLE_CHANGED).toBe("user_role_changed");
    expect(AUDIT_ACTIONS.USER_STATUS_CHANGED).toBe("user_status_changed");
    expect(AUDIT_ACTIONS.PASSWORD_CHANGED).toBe("user_password_changed");
    expect(AUDIT_ACTIONS.GRADE_OVERRIDDEN).toBe("evaluation_score_overridden");
    expect(AUDIT_ACTIONS.RESERVATION_PREEMPTED).toBe("reservation.preempted");
    expect(AUDIT_ACTIONS.RESERVATION_CANCELLED).toBe("reservation_cancelled");
    expect(AUDIT_ACTIONS.SETTINGS_CHANGED).toBe("SETTINGS_CHANGED");
    expect(AUDIT_ACTIONS.CLINICAL_CASE_VALIDATED).toBe("clinical_case_validated_by_expert");
    expect(AUDIT_ACTIONS.MEDIA_UPLOADED).toBe("media_uploaded");
  });

  it("maps every key to a distinct persisted string", () => {
    expect(AUDIT_ACTION_VALUES).toHaveLength(Object.keys(AUDIT_ACTIONS).length);
  });
});
