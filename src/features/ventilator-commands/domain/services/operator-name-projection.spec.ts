/*
 * Funcionalidad: Pruebas de la proyección del nombre del operador
 * Descripción: Verifica que docentes y administradores vean siempre el nombre del operador, que un estudiante lo vea solo si es él mismo o si ambos son titulares de la reserva activa, y que en otro caso reciba la etiqueta genérica de docente o estudiante
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  OPERATOR_STUDENT_LABEL_KEY,
  OPERATOR_TEACHER_LABEL_KEY,
  type OperatorIdentity,
  type OperatorNameProjection,
  type OperatorNameViewer,
  projectOperatorName,
} from "@/features/ventilator-commands/domain/services/operator-name-projection";

const HOLDER_STUDENT: OperatorIdentity = { userId: "student-1", displayName: "Ana Student", role: "STUDENT", isHolder: true };
const TEACHER: OperatorIdentity = { userId: "teacher-1", displayName: "Tomas Teacher", role: "TEACHER", isHolder: false };

describe("projectOperatorName", () => {
  it.each<[string, OperatorIdentity, OperatorNameViewer, OperatorNameProjection]>([
    ["staff see a student", HOLDER_STUDENT, { userId: "teacher-2", role: "TEACHER", isHolder: false }, { operatorName: "Ana Student", operatorLabelKey: null }],
    ["staff see a teacher", TEACHER, { userId: "admin-1", role: "ADMIN", isHolder: false }, { operatorName: "Tomas Teacher", operatorLabelKey: null }],
    ["a holder sees another holder", HOLDER_STUDENT, { userId: "student-2", role: "STUDENT", isHolder: true }, { operatorName: "Ana Student", operatorLabelKey: null }],
    ["the operator sees themself", TEACHER, { userId: "teacher-1", role: "STUDENT", isHolder: false }, { operatorName: "Tomas Teacher", operatorLabelKey: null }],
    ["a holder gets a label for a teacher", TEACHER, { userId: "student-2", role: "STUDENT", isHolder: true }, { operatorName: null, operatorLabelKey: OPERATOR_TEACHER_LABEL_KEY }],
    ["a stranger gets a label for a student", HOLDER_STUDENT, { userId: "student-9", role: "STUDENT", isHolder: false }, { operatorName: null, operatorLabelKey: OPERATOR_STUDENT_LABEL_KEY }],
  ])("%s", (_label: string, operator: OperatorIdentity, viewer: OperatorNameViewer, expected: OperatorNameProjection) => {
    expect(projectOperatorName(operator, viewer)).toEqual(expected);
  });

  it("projects nothing when nobody controls the ventilator", () => {
    expect(projectOperatorName(undefined, { role: "ADMIN", isHolder: false })).toEqual({ operatorName: null, operatorLabelKey: null });
  });
});
