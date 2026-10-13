/*
 * Funcionalidad: Decorador RawResponse
 * Descripción: Marca controladores o rutas cuya respuesta JSON no usa el envoltorio APIResponse (por ejemplo las sondas de salud), para que la documentación OpenAPI describa el cuerpo tal como se envía
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SetMetadata } from "@nestjs/common";

export const RAW_RESPONSE_KEY: string = "rawResponse";

export const RawResponse = (): MethodDecorator & ClassDecorator => SetMetadata(RAW_RESPONSE_KEY, true);
