/*
 * Funcionalidad: Comando ChangeLogRequester
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { TEACHER_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

export class ChangeLogRequester {
  public readonly id: string;
  public readonly role: string;

  public constructor({ id, role }: { id: string; role: string }) {
    this.id = id;
    this.role = role;
  }

  public get ownChangesOnly(): string | undefined {
    return this.role === TEACHER_ROLE_VALUE ? this.id : undefined;
  }
}
