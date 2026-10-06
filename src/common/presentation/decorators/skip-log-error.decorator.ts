/*
 * Funcionalidad: Decorador SkipLogError
 * Descripción: Marca clases de error que no se registran en consola ni se reportan a Sentry
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

const SKIP_LOG_ERROR_KEY: unique symbol = Symbol("SKIP_LOG_ERROR");

export function SkipLogError(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(SKIP_LOG_ERROR_KEY, true, target);
  };
}

export function shouldSkipLogError(exception: unknown): boolean {
  if (exception == null || typeof exception !== "object") {
    return false;
  }

  return Reflect.getMetadata(SKIP_LOG_ERROR_KEY, exception.constructor) === true;
}
