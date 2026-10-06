/*
 * Funcionalidad: Puerto IHtmlSanitizer
 * Descripción: Define el contrato y el token de inyección del saneador HTML por lista blanca que usan las escrituras de bloques de página (HTML permitido y texto sin etiquetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type BlockSanitizer } from "@/features/pages/domain/services/page-block-content";

export const HTML_SANITIZER_TOKEN: unique symbol = Symbol("HTML_SANITIZER_TOKEN");

export type IHtmlSanitizer = BlockSanitizer;
