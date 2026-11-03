/*
 * Funcionalidad: Módulo UsersPortsModule
 * Descripción: Parte global de la raíz de composición que enlaza el puerto STUDENT_SCOPE_CHECKER_TOKEN de la feature de usuarios a GroupsFacade.canViewStudent, de modo que UsersModule no importa GroupsModule (que ya lo importa a él)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module, type Provider } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { GroupsModule } from "@/features/groups/groups.module";
import {
  type IStudentScopeChecker,
  STUDENT_SCOPE_CHECKER_TOKEN,
  type StudentScopeActor,
} from "@/features/users/application/ports/student-scope-checker.interface";

export const STUDENT_SCOPE_CHECKER_PROVIDER: Provider = {
  provide: STUDENT_SCOPE_CHECKER_TOKEN,
  inject: [GroupsFacade],
  useFactory: (groups: GroupsFacade): IStudentScopeChecker => ({
    canViewStudent: (actor: StudentScopeActor, studentId: string): Promise<boolean> => groups.canViewStudent(actor, studentId),
  }),
};

@Global()
@Module({
  imports: [GroupsModule],
  providers: [STUDENT_SCOPE_CHECKER_PROVIDER],
  exports: [STUDENT_SCOPE_CHECKER_TOKEN],
})
export class UsersPortsModule {}
