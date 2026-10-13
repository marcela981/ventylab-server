/*
 * Funcionalidad: Índice de fábricas de prueba
 * Descripción: Reexporta las fábricas Prisma de usuarios, grupos, contenido, evaluaciones, casos clínicos y reservas para las suites de integración y e2e
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export * from "./clinical-cases.factory";
export * from "./content.factory";
export * from "./evaluations.factory";
export * from "./groups.factory";
export * from "./reservations.factory";
export * from "./sequence";
export * from "./users.factory";
