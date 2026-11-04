/*
 * Funcionalidad: Puerto IStudentScopeChecker
 * Descripción: Contrato con el que la feature de usuarios pregunta si un docente gestiona algún grupo de un estudiante (grupos que creó o supervisa); lo enlaza la raíz de composición a GroupsFacade, porque GroupsModule ya importa UsersModule y la importación inversa crearía un ciclo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const STUDENT_SCOPE_CHECKER_TOKEN: unique symbol = Symbol("STUDENT_SCOPE_CHECKER_TOKEN");

export interface StudentScopeActor {
  readonly id: string;
  readonly role: string;
}

export interface IStudentScopeChecker {
  canViewStudent(actor: StudentScopeActor, studentId: string): Promise<boolean>;
}
