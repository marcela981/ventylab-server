/*
 * Funcionalidad: Restricciones numéricas
 * Descripción: Define restricciones predefinidas para valores numéricos en centavos y decimales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { NumberConstraints } from "@/common/domain/value-objects/numeric-value";

export const CENTS_CONSTRAINTS: NumberConstraints = { min: 0 };

export const DECIMAL_CONSTRAINTS: NumberConstraints = { min: 0, allowDecimals: true };
