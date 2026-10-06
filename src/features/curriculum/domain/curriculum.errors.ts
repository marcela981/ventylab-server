/*
 * Funcionalidad: Errores de dominio del currículo
 * Descripción: Define CurriculumNodeHasStudentDataError, que el filtro HTTP traduce a 409 mediante errors-map e i18n cuando un nodo curricular o sus descendientes tienen datos de estudiantes y debe archivarse en lugar de eliminarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class CurriculumNodeHasStudentDataError extends DomainError {
  public constructor() {
    super("The content or one of its descendants has student data; archive it instead of deleting it", "curriculum.node_has_student_data");
  }
}
