/*
 * Funcionalidad: Utilidad extractBearerToken
 * Descripción: Extrae el token Bearer de la cabecera Authorization
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Request } from "express";

export function extractBearerToken(request: Request): string | undefined {
  const authHeader: string | undefined = request.headers.authorization;

  if (!authHeader) {
    return undefined;
  }

  const [type, token] = authHeader.split(" ");

  return type === "Bearer" && token ? token : undefined;
}
