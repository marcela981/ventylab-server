/*
 * Funcionalidad: Puerto IStudentGroupsReader
 * Descripción: Contrato con el que la feature de usuarios lee los grupos STUDENT activos de varios estudiantes en una sola lectura (cabecera del detalle y listado de estudiantes); lo enlaza la raíz de composición a GroupsFacade, porque GroupsModule ya importa UsersModule y la importación inversa crearía un ciclo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const STUDENT_GROUPS_READER_TOKEN: unique symbol = Symbol("STUDENT_GROUPS_READER_TOKEN");

export interface StudentGroupRef {
  readonly id: string;
  readonly name: string;
}

export interface IStudentGroupsReader {
  // Active STUDENT groups by student id; a student without one is absent from the map.
  getActiveGroups(studentIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, StudentGroupRef[]>>;
}
