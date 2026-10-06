/*
 * Funcionalidad: Utilidades de cliente Prisma
 * Descripción: Define los tipos PrismaTransaction y PrismaExecutor y resolveClient para usar la transacción activa o el cliente global
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type PrismaClient } from "@prisma/client";

export type PrismaTransaction = Prisma.TransactionClient;

export type PrismaExecutor = PrismaClient | PrismaTransaction;

export function resolveClient(prisma: PrismaClient, transaction?: unknown): PrismaExecutor {
  return (transaction as PrismaTransaction | undefined) ?? prisma;
}
