/*
 * Funcionalidad: Decorador SkipSaveErrorLog
 * Descripción: Marca clases de error que no se persisten en la tabla error_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

const SKIP_SAVE_ERROR_LOG_KEY: unique symbol = Symbol("SKIP_SAVE_ERROR_LOG");

export function SkipSaveErrorLog(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(SKIP_SAVE_ERROR_LOG_KEY, true, target);
  };
}

export function shouldSkipSaveErrorLog(exception: unknown): boolean {
  if (exception == null || typeof exception !== "object") {
    return false;
  }

  return Reflect.getMetadata(SKIP_SAVE_ERROR_LOG_KEY, exception.constructor) === true;
}
