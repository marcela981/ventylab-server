/*
 * Funcionalidad: Tipos de Request de Express
 * Descripción: Amplía Express.Request con traceId y el usuario autenticado (JwtPayload) que asignan el middleware de traza y los guards de JWT
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as express from "express";

import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";

declare global {
  namespace Express {
    interface Request {
      traceId: string;
      user?: JwtPayload;
    }
  }
}
