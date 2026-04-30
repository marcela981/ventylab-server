/*
 * Funcionalidad: Health Check — endpoint de salud del servidor
 * Descripción: GET /api/health público (sin autenticación) para detección y mitigación de
 *              cold starts. Retorna { status, uptime } sin acceder a la base de datos.
 *              Usado por el cliente frontend para warm-up del backend en Render free tier
 *              tras 15 min de inactividad (cold start de 30-50 s).
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria
 *        que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Sin autenticación. Omitido del rate limiter global (ver index.ts skip fn).
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

export default router;
