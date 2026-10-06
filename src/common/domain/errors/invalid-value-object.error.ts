/*
 * Funcionalidad: Error InvalidValueObjectError
 * Descripción: Error de dominio lanzado cuando un objeto de valor recibe un valor inválido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class InvalidValueObjectError extends DomainError {
  public constructor(valueObjectName: string, value: unknown) {
    super(
      `Invalid ${valueObjectName}: ${String(value)}`,
      "common.invalid_value_object",
    );
  }
}
