/*
 * Funcionalidad: Pruebas de UsersPortsModule
 * Descripción: Verifica que el puerto de alcance docente de la feature de usuarios se enlaza a GroupsFacade.canViewStudent con el actor y el estudiante recibidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";

import { STUDENT_SCOPE_CHECKER_PROVIDER } from "@/composition/users-ports.module";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type IStudentScopeChecker, STUDENT_SCOPE_CHECKER_TOKEN } from "@/features/users/application/ports/student-scope-checker.interface";

describe("UsersPortsModule", () => {
  it("binds the student scope checker to GroupsFacade.canViewStudent", async () => {
    const provider: FactoryProvider<IStudentScopeChecker> = STUDENT_SCOPE_CHECKER_PROVIDER as FactoryProvider<IStudentScopeChecker>;
    const facade: { canViewStudent: jest.Mock } = { canViewStudent: jest.fn().mockResolvedValue(true) };

    const checker: IStudentScopeChecker = provider.useFactory(facade) as IStudentScopeChecker;

    expect(provider.provide).toBe(STUDENT_SCOPE_CHECKER_TOKEN);
    expect(provider.inject).toEqual([GroupsFacade]);
    expect(await checker.canViewStudent({ id: "teacher-1", role: "TEACHER" }, "student-1")).toBe(true);
    expect(facade.canViewStudent).toHaveBeenCalledWith({ id: "teacher-1", role: "TEACHER" }, "student-1");
  });
});
