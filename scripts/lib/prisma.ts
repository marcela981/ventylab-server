/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : Cliente Prisma independiente para los scripts.
 * Descripción   : Los scripts de auditoría se ejecutan fuera de NestJS
 *                 (npx tsx), por lo que no pueden usar PrismaService.
 *                 Este módulo crea un único PrismaClient con DATABASE_URL
 *                 leído desde .env (dotenv), igual que el singleton
 *                 legacy src/shared/infrastructure/database.ts.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
