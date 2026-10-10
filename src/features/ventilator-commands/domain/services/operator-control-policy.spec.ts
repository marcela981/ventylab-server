/*
 * Funcionalidad: Pruebas de la política de control exclusivo del ventilador
 * Descripción: Verifica quién toma el control libre, quién puede arrebatarlo (líder del grupo titular, docente o administrador), cuándo queda bloqueado y quién puede liberarlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  canReleaseControl,
  type ControlRequestFacts,
  decideControlRequest,
} from "@/features/ventilator-commands/domain/services/operator-control-policy";

const HOLDER: ControlRequestFacts = { actorUserId: "s1", actorRole: "STUDENT", isHolder: true, leadsHolderGroup: false, currentOperatorUserId: undefined };

describe("decideControlRequest", () => {
  it("lets a holder, a teacher or an administrator take free control", () => {
    const decisions: string[] = [
      decideControlRequest("take", HOLDER),
      decideControlRequest("take", { ...HOLDER, actorUserId: "t1", actorRole: "TEACHER", isHolder: false }),
      decideControlRequest("take", { ...HOLDER, actorUserId: "a1", actorRole: "ADMIN", isHolder: false }),
    ];

    expect(decisions).toEqual(["take", "take", "take"]);
  });

  it("rejects a student who is not a holder", () => {
    const decision: string = decideControlRequest("takeover", { ...HOLDER, isHolder: false, currentOperatorUserId: "s2" });

    expect(decision).toBe("not_holder");
  });

  it("reports when the caller already operates", () => {
    const decision: string = decideControlRequest("take", { ...HOLDER, currentOperatorUserId: "s1" });

    expect(decision).toBe("already_operator");
  });

  it("locks a plain take when someone else operates", () => {
    const decisions: string[] = [
      decideControlRequest("take", { ...HOLDER, currentOperatorUserId: "s2" }),
      decideControlRequest("take", { ...HOLDER, actorRole: "TEACHER", currentOperatorUserId: "s2" }),
    ];

    expect(decisions).toEqual(["locked", "locked"]);
  });

  it("allows a takeover only to the holder group leader, a teacher or an administrator", () => {
    const decisions: string[] = [
      decideControlRequest("takeover", { ...HOLDER, currentOperatorUserId: "s2" }),
      decideControlRequest("takeover", { ...HOLDER, leadsHolderGroup: true, currentOperatorUserId: "s2" }),
      decideControlRequest("takeover", { ...HOLDER, actorUserId: "t1", actorRole: "TEACHER", isHolder: false, currentOperatorUserId: "s2" }),
      decideControlRequest("takeover", { ...HOLDER, actorUserId: "a1", actorRole: "ADMIN", isHolder: false, currentOperatorUserId: "s2" }),
    ];

    expect(decisions).toEqual(["locked", "takeover", "takeover", "takeover"]);
  });

  it("treats a takeover of free control as a plain take", () => {
    const decision: string = decideControlRequest("takeover", HOLDER);

    expect(decision).toBe("take");
  });
});

describe("canReleaseControl", () => {
  it("lets the operator, a teacher or an administrator release control", () => {
    const decisions: boolean[] = [
      canReleaseControl("s1", "STUDENT", "s1"),
      canReleaseControl("s2", "STUDENT", "s1"),
      canReleaseControl("t1", "TEACHER", "s1"),
      canReleaseControl("a1", "ADMIN", "s1"),
    ];

    expect(decisions).toEqual([true, false, true, true]);
  });
});
